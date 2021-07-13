import { CeloTransactionObject } from '@celo/connect'
import { StableToken } from '@celo/contractkit'
import { ExchangeWrapper } from '@celo/contractkit/lib/wrappers/Exchange'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { ReserveWrapper } from '@celo/contractkit/lib/wrappers/Reserve'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { CELO_AMOUNT_FOR_ESTIMATE, DOLLAR_AMOUNT_FOR_ESTIMATE } from '@celo/utils/lib/celoHistory'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { CeloExchangeEvents, FeeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  ExchangeTokensAction,
  FetchExchangeRateAction,
  FetchTobinTaxAction,
  setExchangeRate,
  setTobinTax,
  WithdrawCeloAction,
  withdrawCeloCanceled,
  withdrawCeloFailed,
  withdrawCeloSuccess,
} from 'src/exchange/actions'
import { ExchangeRates, exchangeRatesSelector } from 'src/exchange/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { sendPaymentOrInviteSuccess } from 'src/send/actions'
import {
  convertToContractDecimals,
  createTokenTransferTransaction,
  getTokenContract,
} from 'src/tokens/saga'
import { addStandbyTransaction, removeStandbyTransaction } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import {
  newTransactionContext,
  TransactionContext,
  TransactionStatus,
} from 'src/transactions/types'
import { CURRENCIES, Currency, StableCurrency, STABLE_CURRENCIES } from 'src/utils/currencies'
import {
  getRateForMakerToken,
  getTakerAmount,
  goldToDollarAmount,
} from 'src/utils/currencyExchange'
import { roundDown } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import * as util from 'util'

const TAG = 'exchange/saga'

const EXCHANGE_DIFFERENCE_PERCENT_TOLERATED = 0.01 // Maximum % difference between actual and displayed takerAmount

export function* doFetchTobinTax({ makerAmount, makerToken }: FetchTobinTaxAction) {
  try {
    let tobinTax
    if (makerToken === Currency.Celo) {
      yield call(getConnectedAccount)

      const contractKit = yield call(getContractKit)
      const reserve: ReserveWrapper = yield call([
        contractKit.contracts,
        contractKit.contracts.getReserve,
      ])

      const tobinTaxFraction = yield call(reserve.getOrComputeTobinTax().txo.call)

      if (!tobinTaxFraction) {
        Logger.error(TAG, 'Unable to fetch tobin tax')
        throw new Error('Unable to fetch tobin tax')
      }

      // Tobin tax represents % tax on gold transfer, stored as fraction tuple
      tobinTax = tobinTaxFraction['0'] / tobinTaxFraction['1']
      if (tobinTax > 0) {
        tobinTax = makerAmount.times(tobinTax).toString()
      }
    } else {
      // Tobin tax only charged for gold transfers
      tobinTax = 0
    }

    Logger.debug(TAG, `Retrieved Tobin tax rate: ${tobinTax}`)
    yield put(setTobinTax(tobinTax.toString()))
  } catch (error) {
    ValoraAnalytics.track(FeeEvents.fetch_tobin_tax_failed, { error: error.message })
    Logger.error(TAG, 'Error fetching Tobin tax', error)
    yield put(showError(ErrorMessages.CALCULATE_FEE_FAILED))
  }
}

export async function getExchangeContract(token: StableCurrency) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  const contractKit = await getContractKitAsync(false)
  switch (token) {
    case Currency.Dollar:
      return contractKit.contracts.getExchange(StableToken.cUSD)
    case Currency.Euro:
      return contractKit.contracts.getExchange(StableToken.cEUR)
    default:
      throw new Error(`Could not fetch contract for unknown token ${token}`)
  }
}

export function* doFetchExchangeRate(action: FetchExchangeRateAction) {
  Logger.debug(TAG, 'Calling @doFetchExchangeRate')

  const { makerToken, makerAmount } = action
  try {
    ValoraAnalytics.track(CeloExchangeEvents.celo_fetch_exchange_rate_start)
    yield call(getConnectedAccount)

    let makerAmountInWei: BigNumber | null = null
    if (makerAmount && makerToken) {
      makerAmountInWei = ((yield call(
        convertToContractDecimals,
        makerAmount,
        makerToken
      )) as BigNumber).integerValue()
    }

    // If makerAmount and makerToken are given, use them to estimate the exchange rate,
    // as exchange rate depends on amount sold. Else default to preset large sell amount.
    const sellAmounts: Record<Currency, BigNumber> = Object.keys(CURRENCIES).reduce(
      (amounts, currency) => {
        amounts[currency as Currency] =
          makerAmountInWei && !makerAmountInWei.isZero() && makerToken === currency
            ? makerAmountInWei
            : currency === Currency.Celo
            ? CELO_AMOUNT_FOR_ESTIMATE
            : DOLLAR_AMOUNT_FOR_ESTIMATE
        return amounts
      },
      {} as Record<Currency, BigNumber>
    )

    const exchangeContracts: ExchangeWrapper[] = yield all(
      STABLE_CURRENCIES.map((currency: StableCurrency) => call(getExchangeContract, currency))
    )

    const exchangeRates: Record<Currency, Record<Currency, string>> = Object.keys(
      CURRENCIES
    ).reduce((rates, currency) => {
      rates[currency as Currency] = {
        // Empty strings will be replaced by real values before dispatching to the store or an error will be thrown.
        [Currency.Celo]: '',
        [Currency.Euro]: '',
        [Currency.Dollar]: '',
      }
      return rates
    }, {} as Record<Currency, Record<Currency, string>>)

    // TODO: Consider making all the fetches for exchange rates in parallel to reduce the time this loop takes.
    for (let i = 0; i < STABLE_CURRENCIES.length; i++) {
      const stableCurrency = STABLE_CURRENCIES[i]
      const exchange = exchangeContracts[i]
      const [stableSellExchangeRate, celoSellExchangeRate]: [BigNumber, BigNumber] = yield all([
        call([exchange, exchange.getStableExchangeRate], sellAmounts[stableCurrency]),
        call([exchange, exchange.getGoldExchangeRate], sellAmounts[Currency.Celo]),
      ])

      if (!stableSellExchangeRate || !celoSellExchangeRate) {
        const errorMessage = `Invalid exchange rates between ${stableCurrency} and CELO`
        Logger.error(TAG, errorMessage)
        throw new Error(errorMessage)
      }

      Logger.debug(
        TAG,
        `Retrieved exchange rate:
        ${stableSellExchangeRate.toString()} CELO per ${stableCurrency}, estimated at ${
          sellAmounts[stableCurrency]
        }
        ${celoSellExchangeRate.toString()} ${stableCurrency} per CELO, estimated at ${
          sellAmounts[Currency.Celo]
        }`
      )

      exchangeRates[stableCurrency][Currency.Celo] = stableSellExchangeRate.toString()
      exchangeRates[Currency.Celo][stableCurrency] = celoSellExchangeRate.toString()

      // Always tracking in stable currency for consistancy
      ValoraAnalytics.track(CeloExchangeEvents.celo_fetch_exchange_rate_complete, {
        currency: stableCurrency,
        makerAmount: sellAmounts[stableCurrency].toNumber(),
        exchangeRate: stableSellExchangeRate.toNumber(),
      })
    }

    yield put(setExchangeRate(exchangeRates))
  } catch (error) {
    ValoraAnalytics.track(CeloExchangeEvents.celo_fetch_exchange_rate_error, {
      error: error.message,
    })
    Logger.error(TAG, 'Error fetching exchange rate', error)
    yield put(showError(ErrorMessages.EXCHANGE_RATE_FAILED))
  }
}

export function* exchangeGoldAndStableTokens(action: ExchangeTokensAction) {
  Logger.debug(`${TAG}@exchangeGoldAndStableTokens`, 'Exchanging gold and stable token')
  const { makerToken, makerAmount, takerToken, inputAmount } = action
  const isStableToGold = makerToken === Currency.Dollar
  const isInputStable = makerAmount.isEqualTo(inputAmount) === isStableToGold

  Logger.debug(TAG, `Exchanging ${makerAmount.toString()} of token ${makerToken}`)
  let context: TransactionContext | null = null
  try {
    ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_start)
    const account: string = yield call(getConnectedUnlockedAccount)
    navigate(Screens.ExchangeHomeScreen)

    const exchangeRates: ExchangeRates = yield select(exchangeRatesSelector)
    const exchangeRate = getRateForMakerToken(exchangeRates, makerToken, takerToken)
    if (!exchangeRate) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: 'Invalid exchange rate from exchange contract',
      })
      Logger.error(TAG, 'Invalid exchange rate from exchange contract')
      return
    }
    if (exchangeRate.isZero()) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: 'Cannot do exchange with rate of 0',
      })
      Logger.error(TAG, 'Cannot do exchange with rate of 0. Stopping.')
      throw new Error('Invalid exchange rate')
    }

    const standbyTxInValue = inputAmount.multipliedBy(
      isInputStable === !isStableToGold ? exchangeRate : 1
    )
    const standbyTxOutValue = inputAmount.multipliedBy(
      isInputStable !== !isStableToGold ? exchangeRate.pow(-1) : 1
    )
    context = yield call(
      createStandbyTx,
      makerToken,
      standbyTxInValue,
      takerToken,
      standbyTxOutValue
    )

    const contractKit = yield call(getContractKit)
    const stableToken = (makerToken === Currency.Celo ? takerToken : makerToken) as StableCurrency

    const goldTokenContract: GoldTokenWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getGoldToken,
    ])
    const stableTokenContract: StableTokenWrapper = yield call(getTokenContract, stableToken)
    const exchangeContract: ExchangeWrapper = yield call(getExchangeContract, stableToken)

    const convertedMakerAmount: BigNumber = roundDown(
      yield call(convertToContractDecimals, inputAmount, makerToken),
      0
    ) // Nearest integer in wei
    const sellGold = makerToken === Currency.Celo

    const updatedExchangeRate: BigNumber = yield call(
      // Updating with actual makerAmount, rather than conservative estimate displayed
      [exchangeContract, exchangeContract.getExchangeRate],
      convertedMakerAmount,
      sellGold
    )

    const exceedsExpectedSize =
      makerToken === Currency.Celo
        ? convertedMakerAmount.isGreaterThan(CELO_AMOUNT_FOR_ESTIMATE)
        : convertedMakerAmount.isGreaterThan(DOLLAR_AMOUNT_FOR_ESTIMATE)

    if (exceedsExpectedSize) {
      Logger.error(
        TAG,
        `Displayed exchange rate was estimated with a smaller makerAmount than actual ${convertedMakerAmount}`
      )
      // Note that exchange will still go through if makerAmount difference is within EXCHANGE_DIFFERENCE_TOLERATED
    }

    const tokenExchangeRate = exchangeRate.pow(isStableToGold ? -1 : 1)

    const minimumTakerAmount = BigNumber.maximum(
      getTakerAmount(inputAmount, isInputStable ? 1 : tokenExchangeRate).multipliedBy(
        1 +
          (isStableToGold && !isInputStable
            ? EXCHANGE_DIFFERENCE_PERCENT_TOLERATED
            : -EXCHANGE_DIFFERENCE_PERCENT_TOLERATED)
      ),
      0
    )
    const updatedTakerAmount = getTakerAmount(makerAmount, updatedExchangeRate)

    if (minimumTakerAmount[isStableToGold ? 'isLessThan' : 'isGreaterThan'](updatedTakerAmount)) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: `Not receiving enough ${makerToken}. Expected ${minimumTakerAmount} but received ${updatedTakerAmount.toString()}`,
      })
      Logger.error(
        TAG,
        `Not receiving enough ${makerToken} due to change in exchange rate. Exchange failed.`
      )
      yield put(showError(ErrorMessages.EXCHANGE_RATE_CHANGE))
      return
    }

    const convertedTakerAmount: BigNumber = roundDown(
      yield call(convertToContractDecimals, minimumTakerAmount, takerToken),
      0
    )
    Logger.debug(
      TAG,
      `Will receive at least ${convertedTakerAmount}
      wei for ${convertedMakerAmount} wei of ${makerToken}`
    )

    // Generate and send a transaction to approve payment to the exchange.
    let approveTx
    if (!isStableToGold) {
      approveTx = goldTokenContract.approve(
        exchangeContract.address,
        convertedMakerAmount.toString()
      )
    } else {
      approveTx = stableTokenContract.approve(
        exchangeContract.address,
        convertedTakerAmount.multipliedBy(10 ** 20).toString()
      )
    }

    yield call(
      sendTransaction,
      approveTx.txo,
      account,
      newTransactionContext(TAG, `Approve exchange of ${makerToken}`),
      undefined, // gas
      undefined, // gasPrice
      makerToken
    )
    Logger.debug(TAG, `Transaction approved: ${util.inspect(approveTx.txo.arguments)}`)

    contractKit.defaultAccount = account

    const tx: CeloTransactionObject<string> = yield call(
      isStableToGold !== isInputStable ? exchangeContract.buy : exchangeContract.sell,
      convertedMakerAmount.toString(),
      convertedTakerAmount
        .multipliedBy(isStableToGold !== isInputStable ? 1 : tokenExchangeRate)
        .decimalPlaces(0)
        .toString(),
      !isInputStable
    )

    if (context === null) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: 'Missing transaction ID',
      })
      Logger.error(TAG, 'No transaction ID. Did not exchange.')
      return
    }
    const { receipt, error } = yield call(
      sendAndMonitorTransaction,
      tx,
      account,
      context,
      undefined, // currency, undefined because it's an exchange and we need both.
      makerToken
    )
    if (receipt) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_complete, {
        txId: context.id,
        currency: makerToken,
        amount: makerAmount.toString(),
      })
    } else {
      throw error
    }
  } catch (error) {
    ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, { error: error?.message })
    Logger.error(TAG, 'Error doing exchange', error)
    const isCeloPurchase = takerToken === Currency.Celo

    ValoraAnalytics.track(
      isCeloPurchase ? CeloExchangeEvents.celo_buy_error : CeloExchangeEvents.celo_sell_error,
      {
        error,
      }
    )
    if (context?.id) {
      yield put(removeStandbyTransaction(context.id))
    }

    yield put(showErrorOrFallback(error, ErrorMessages.EXCHANGE_FAILED))
  }
}

function* createStandbyTx(
  inToken: Currency,
  inValue: BigNumber,
  outToken: Currency,
  outValue: BigNumber
) {
  const context = newTransactionContext(TAG, `Exchange ${inToken}`)
  yield put(
    addStandbyTransaction({
      context,
      type: TokenTransactionType.Exchange,
      status: TransactionStatus.Pending,
      inCurrency: inToken,
      inValue: inValue.toString(),
      outCurrency: outToken,
      outValue: outValue.toString(),
      timestamp: Math.floor(Date.now() / 1000),
    })
  )
  return context
}

function* celoToDollarAmount(amount: BigNumber) {
  const exchangeRates: ExchangeRates = yield select(exchangeRatesSelector)
  const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Dollar, Currency.Celo)
  return goldToDollarAmount(amount, exchangeRate) || new BigNumber(0)
}

export function* withdrawCelo(action: WithdrawCeloAction) {
  let context: TransactionContext | null = null
  try {
    const { recipientAddress, amount, isCashOut } = action
    const account: string = yield call(getConnectedUnlockedAccount)

    navigate(isCashOut ? Screens.WalletHome : Screens.ExchangeHomeScreen)

    context = newTransactionContext(TAG, 'Withdraw CELO')
    yield put(
      addStandbyTransaction({
        context,
        type: TokenTransactionType.Sent,
        comment: '',
        status: TransactionStatus.Pending,
        value: amount.toString(),
        currency: Currency.Celo,
        timestamp: Math.floor(Date.now() / 1000),
        address: recipientAddress,
      })
    )

    const tx: CeloTransactionObject<boolean> = yield call(
      createTokenTransferTransaction,
      Currency.Celo,
      {
        recipientAddress,
        amount,
        comment: '',
      }
    )

    yield call(sendAndMonitorTransaction, tx, account, context, Currency.Celo, Currency.Celo)

    const dollarAmount = yield call(celoToDollarAmount, amount)
    yield put(sendPaymentOrInviteSuccess(dollarAmount))

    yield put(withdrawCeloSuccess())

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_completed, {
      amount: amount.toString(),
    })
  } catch (error) {
    Logger.error(TAG, 'Error withdrawing CELO', error)

    if (error.message === ErrorMessages.PIN_INPUT_CANCELED) {
      yield put(withdrawCeloCanceled())
      return
    }

    const errorToShow =
      error.message === ErrorMessages.INCORRECT_PIN
        ? ErrorMessages.INCORRECT_PIN
        : ErrorMessages.TRANSACTION_FAILED
    yield put(withdrawCeloFailed(context?.id, errorToShow))

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_error, {
      error,
    })
  }
}

export function* watchFetchTobinTax() {
  yield takeLatest(Actions.FETCH_TOBIN_TAX, doFetchTobinTax)
}

export function* watchFetchExchangeRate() {
  yield takeLatest(Actions.FETCH_EXCHANGE_RATE, doFetchExchangeRate)
}

export function* watchExchangeTokens() {
  yield takeEvery(Actions.EXCHANGE_TOKENS, exchangeGoldAndStableTokens)
}

export function* watchWithdrawCelo() {
  yield takeEvery(Actions.WITHDRAW_CELO, withdrawCelo)
}

export function* exchangeSaga() {
  yield spawn(watchFetchExchangeRate)
  yield spawn(watchFetchTobinTax)
  yield spawn(watchExchangeTokens)
  yield spawn(watchWithdrawCelo)
}
