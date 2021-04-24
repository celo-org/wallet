import { CeloTransactionObject } from '@celo/connect'
import { CeloContract } from '@celo/contractkit'
import { retryAsync } from '@celo/utils/lib/async'
import BigNumber from 'bignumber.js'
import { call, put, take, takeEvery } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { WALLET_BALANCE_UPPER_BOUND } from 'src/config'
import { FeeInfo } from 'src/fees/saga'
import { CURRENCY_ENUM, WEI_PER_TOKEN } from 'src/geth/consts'
import { addStandbyTransaction, removeStandbyTransaction } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { TransactionContext, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import * as utf8 from 'utf8'

const TAG = 'tokens/saga'

// The number of wei that represent one unit in a contract
const contractWeiPerUnit: { [key in CURRENCY_ENUM]: BigNumber | null } = {
  [CURRENCY_ENUM.GOLD]: WEI_PER_TOKEN,
  [CURRENCY_ENUM.DOLLAR]: WEI_PER_TOKEN,
}

function* getWeiPerUnit(token: CURRENCY_ENUM) {
  let weiPerUnit = contractWeiPerUnit[token]
  if (!weiPerUnit) {
    const contract = yield call(getTokenContract, token)
    const decimals = yield call(contract.decimals)
    weiPerUnit = new BigNumber(10).pow(decimals)
    contractWeiPerUnit[token] = weiPerUnit
  }
  return weiPerUnit
}

export function* convertFromContractDecimals(value: BigNumber, token: CURRENCY_ENUM) {
  const weiPerUnit = yield call(getWeiPerUnit, token)
  return value.dividedBy(weiPerUnit)
}

export function* convertToContractDecimals(value: BigNumber, token: CURRENCY_ENUM) {
  const weiPerUnit = yield call(getWeiPerUnit, token)
  return weiPerUnit.multipliedBy(value)
}

export async function getTokenContract(token: CURRENCY_ENUM) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  const contractKit = await getContractKitAsync(false)
  switch (token) {
    case CURRENCY_ENUM.GOLD:
      return contractKit.contracts.getGoldToken()
    case CURRENCY_ENUM.DOLLAR:
      return contractKit.contracts.getStableToken()
    default:
      throw new Error(`Could not fetch contract for unknown token ${token}`)
  }
}

interface TokenFetchFactory {
  actionName: string
  token: CURRENCY_ENUM
  actionCreator: (balance: string) => any
  tag: string
}

export function tokenFetchFactory({ actionName, token, actionCreator, tag }: TokenFetchFactory) {
  function* tokenFetch() {
    try {
      Logger.debug(tag, `Fetching ${token} balance`)
      const account = yield call(getConnectedAccount)
      const tokenContract = yield call(getTokenContract, token)
      const balanceInWei: BigNumber = yield call([tokenContract, tokenContract.balanceOf], account)
      const balance: BigNumber = yield call(convertFromContractDecimals, balanceInWei, token)
      const balanceLogObject =
        token === CURRENCY_ENUM.DOLLAR
          ? {
              dollarBalance: balance.toString(),
            }
          : { goldBalance: balance.toString() }

      // Only update balances when it's less than the upper bound
      if (balance.lt(WALLET_BALANCE_UPPER_BOUND)) {
        yield put(actionCreator(balance.toString()))
        ValoraAnalytics.track(AppEvents.fetch_balance, balanceLogObject)
      } else {
        ValoraAnalytics.track(AppEvents.fetch_balance_error, balanceLogObject)
      }
    } catch (error) {
      Logger.error(tag, 'Error fetching balance', error)
    }
  }

  return function*() {
    return yield takeEvery(actionName, tokenFetch)
  }
}

export interface BasicTokenTransfer {
  recipientAddress: string
  amount: BigNumber.Value
  comment: string
}

export interface TokenTransfer {
  recipientAddress: string
  amount: string
  comment: string
  feeInfo?: FeeInfo
  context: TransactionContext
}

export type TokenTransferAction = { type: string } & TokenTransfer

interface TokenTransferFactory {
  actionName: string
  tag: string
  currency: CURRENCY_ENUM
  fetchAction: () => any
  staticGas?: number
}

// TODO(martinvol) this should go to the SDK
export async function createTokenTransferTransaction(
  currency: CURRENCY_ENUM,
  transferAction: BasicTokenTransfer
) {
  const { recipientAddress, amount, comment } = transferAction
  const contract = await getTokenContract(currency)

  const decimals = await contract.decimals()
  const decimalBigNum = new BigNumber(decimals)
  const decimalFactor = new BigNumber(10).pow(decimalBigNum.toNumber())
  const convertedAmount = new BigNumber(amount).multipliedBy(decimalFactor).toFixed(0)

  const tx = contract.transferWithComment(
    recipientAddress,
    convertedAmount.toString(),
    utf8.encode(comment)
  )

  return tx
}

export async function fetchTokenBalanceInWeiWithRetry(token: CURRENCY_ENUM, account: string) {
  Logger.debug(TAG + '@fetchTokenBalanceInWeiWithRetry', 'Checking account balance', account)
  const tokenContract = await getTokenContract(token)
  // Retry needed here because it's typically the app's first tx and seems to fail on occasion
  // TODO consider having retry logic for ALL contract calls and txs. ContractKit should have this logic.
  const balanceInWei = await retryAsync(tokenContract.balanceOf, 3, [account])
  Logger.debug(
    TAG + '@fetchTokenBalanceInWeiWithRetry',
    'Account balance ' + balanceInWei.toString()
  )
  return balanceInWei
}

export function tokenTransferFactory({
  actionName,
  tag,
  currency,
  fetchAction,
  staticGas,
}: TokenTransferFactory) {
  return function*() {
    while (true) {
      const transferAction: TokenTransferAction = yield take(actionName)
      const { recipientAddress, amount, comment, feeInfo, context } = transferAction

      Logger.debug(
        tag,
        'Transferring token',
        context.description ?? 'No description',
        context.id,
        currency,
        amount,
        feeInfo ? JSON.stringify(feeInfo) : 'undefined'
      )

      yield put(
        addStandbyTransaction({
          context,
          type: TokenTransactionType.Sent,
          comment,
          status: TransactionStatus.Pending,
          value: amount.toString(),
          symbol: currency,
          timestamp: Math.floor(Date.now() / 1000),
          address: recipientAddress,
        })
      )

      try {
        const account = yield call(getConnectedUnlockedAccount)

        const tx: CeloTransactionObject<boolean> = yield call(
          createTokenTransferTransaction,
          currency,
          {
            recipientAddress,
            amount,
            comment,
          }
        )

        yield call(
          sendAndMonitorTransaction,
          tx,
          account,
          context,
          currency,
          feeInfo?.currency,
          feeInfo?.gas?.toNumber(),
          feeInfo?.gasPrice
        )
      } catch (error) {
        Logger.error(tag, 'Error transfering token', error)
        yield put(removeStandbyTransaction(context.id))
        yield put(showErrorOrFallback(error, ErrorMessages.TRANSACTION_FAILED))
      }
    }
  }
}

export async function getCurrencyAddress(currency: CURRENCY_ENUM) {
  const contractKit = await getContractKitAsync(false)
  switch (currency) {
    case CURRENCY_ENUM.GOLD:
      return contractKit.registry.addressFor(CeloContract.GoldToken)
    case CURRENCY_ENUM.DOLLAR:
      return contractKit.registry.addressFor(CeloContract.StableToken)
  }
}
