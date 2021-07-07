import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { GAS_PRICE_INFLATION_FACTOR } from 'src/config'
import { getEscrowTxGas, getReclaimEscrowGas } from 'src/escrow/saga'
import { feeEstimated, FeeType } from 'src/fees/actions'
import { estimateFeeSaga } from 'src/fees/saga'
import { getSendTxGas } from 'src/send/saga'
import { cUsdBalanceSelector } from 'src/stableToken/selectors'
import { getConnectedAccount } from 'src/web3/saga'
import { mockAccount } from 'test/values'

const GAS_AMOUNT = 500000

describe(estimateFeeSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('updates the default invite fee', async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.INVITE })
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(getEscrowTxGas), new BigNumber(GAS_AMOUNT)],
        [matchers.call.fn(getEscrowTxGas), new BigNumber(GAS_AMOUNT)],
        [select(cUsdBalanceSelector), '1'],
      ])
      .put(
        feeEstimated(
          FeeType.INVITE,
          new BigNumber(10000).times(GAS_AMOUNT).times(GAS_PRICE_INFLATION_FACTOR).toString()
        )
      )
      .run()
  })

  it('updates the default send fee', async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.SEND })
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(getSendTxGas), new BigNumber(GAS_AMOUNT)],
        [select(cUsdBalanceSelector), '1'],
      ])
      .put(
        feeEstimated(
          FeeType.SEND,
          new BigNumber(10000).times(GAS_PRICE_INFLATION_FACTOR).times(GAS_AMOUNT).toString()
        )
      )
      .run()
  })

  it('updates the default escrow reclaim fee', async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.SEND })
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(getReclaimEscrowGas), new BigNumber(GAS_AMOUNT)],
        [select(cUsdBalanceSelector), '1'],
      ])
      .put(
        feeEstimated(
          FeeType.SEND,
          new BigNumber(10000).times(GAS_PRICE_INFLATION_FACTOR).times(GAS_AMOUNT).toString()
        )
      )
      .run()
  })

  it("doesn't calculates fee if the balance is zero", async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.SEND })
      .provide([
        [select(cUsdBalanceSelector), '0'],
        [matchers.call.fn(getSendTxGas), new BigNumber(GAS_AMOUNT)],
      ])
      .put(feeEstimated(FeeType.SEND, '0'))
      .run()
  })
})
