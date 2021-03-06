import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import { escrowPaymentDouble } from 'src/escrow/__mocks__'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

const payments = [escrowPaymentDouble({}), escrowPaymentDouble({}), escrowPaymentDouble({})]

function testStore(sentEscrowedPayments: EscrowedPayment[]) {
  return createMockStore({
    stableToken: { balances: { [Currency.Dollar]: '120' } },
    escrow: { sentEscrowedPayments },
  })
}

describe('EscrowedPaymentListScreen', () => {
  it('renders correctly with payments', () => {
    const store = testStore(payments)

    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no payments', () => {
    const store = testStore([])

    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
