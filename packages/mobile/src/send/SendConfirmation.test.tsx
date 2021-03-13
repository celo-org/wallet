import BigNumber from 'bignumber.js'
import * as React from 'react'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ErrorDisplayType } from 'src/alert/reducer'
import { SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { features } from 'src/flags'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getSendFee } from 'src/send/saga'
import SendConfirmation from 'src/send/SendConfirmation'
import { createMockStore, getMockStackScreenProps, sleep } from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockE164NumberInvite,
  mockInviteTransactionData,
  mockTransactionData,
} from 'test/values'

// A fee of 0.01 cUSD.
const TEST_FEE_INFO_CUSD = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  currency: CURRENCY_ENUM.DOLLAR,
}

// A fee of 0.01 CELO.
const TEST_FEE_INFO_CELO = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  currency: CURRENCY_ENUM.GOLD,
}

jest.mock('src/send/saga')

const mockedGetSendFee = getSendFee as jest.Mock

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTransactionData,
  origin: SendOrigin.AppSendFlow,
})

const mockInviteScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockInviteTransactionData,
  origin: SendOrigin.AppSendFlow,
})

describe('SendConfirmation', () => {
  const komenciEnabled = features.KOMENCI

  beforeAll(() => {
    features.KOMENCI = false
    jest.useRealTimers()
  })

  afterAll(() => {
    features.KOMENCI = komenciEnabled
  })

  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  it('renders correctly for send payment confirmation with cUSD fees', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    // Initial render.
    expect(tree).toMatchSnapshot()
    fireEvent.press(tree.getByText('feeEstimate'))

    // Run timers, because Touchable adds some delay.
    jest.runAllTimers()
    // Prevents an unexplained error: TypeError: require(...) is not a function
    await sleep(1000)

    // Wait for fee to be calculated and displayed as "$0.013".
    // NOTE: Use regex here because the text may be split by a newline.
    await waitForElement(() => tree.getByText(/\$\s*0\.0133/s))
    expect(tree).toMatchSnapshot()
  })

  // TODO: Use the logic above for CELO fees
  it('renders correctly for send payment confirmation with CELO fees', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CELO)

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    // Initial render
    expect(tree).toMatchSnapshot()
    // TODO: figure out why fee line items arent rendering
    // fireEvent.press(tree.getByText('feeEstimate'))
    // Run timers, because Touchable adds some delay
    // jest.runAllTimers()
    // expect(tree.queryByText('securityFee')).not.toBeNull()
    // expect(tree.queryByText('0.0100')).toBeNull()

    // TODO figure out why this waitForElement isn't working here and in tests below.
    // Wait for fee to be calculated and displayed
    // await waitForElement(() => getByText('0.001'))
    // expect(queryByText('0.001')).not.toBeNull()

    // expect(toJSON()).toMatchSnapshot()
  })

  it('shows a generic `calculateFeeFailed` error when fee estimate fails due to an unknown error', async () => {
    mockedGetSendFee.mockImplementation(async () => {
      throw new Error('Unknown error message')
    })

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    store.clearActions()

    // Wait for fee error
    await waitForElement(() => tree.getByText('---'))

    expect(store.getActions()).toEqual([
      {
        action: null,
        alertType: 'error',
        buttonMessage: null,
        dismissAfter: 5000,
        displayMethod: ErrorDisplayType.BANNER,
        message: 'calculateFeeFailed',
        title: null,
        type: 'ALERT/SHOW',
        underlyingError: 'calculateFeeFailed',
      },
    ])
  })

  it('shows an `insufficientBalance` error when fee estimate fails due insufficient user balance', async () => {
    mockedGetSendFee.mockImplementation(async () => {
      throw new Error(ErrorMessages.INSUFFICIENT_BALANCE)
    })

    const store = createMockStore({
      stableToken: {
        balance: '0',
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    store.clearActions()

    // Wait for fee error
    await waitForElement(() => tree.getByText('---'))

    expect(store.getActions()).toEqual([
      {
        action: null,
        alertType: 'error',
        buttonMessage: null,
        dismissAfter: 5000,
        displayMethod: ErrorDisplayType.BANNER,
        message: 'insufficientBalance',
        title: null,
        type: 'ALERT/SHOW',
        underlyingError: 'insufficientBalance',
      },
    ])
  })

  it('renders correctly when there are multiple user addresses (should show edit button)', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.FULL,
            address: mockAccount2Invite,
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('updates the comment/reason', () => {
    const store = createMockStore({
      fees: {
        estimates: {
          send: {
            feeInWei: '1',
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    const input = tree.getByTestId('commentInput/send')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(tree.queryAllByDisplayValue(comment)).toHaveLength(1)
  })

  it('navigates to ValidateRecipientIntro when "edit" button is pressed', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }

    const mockAddressValidationType = AddressValidationType.PARTIAL

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: mockAddressValidationType,
            address: mockAccount2Invite,
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('accountEditButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTransactionData,
      addressValidationType: mockAddressValidationType,
    })
  })

  it('does nothing when trying to press "edit" when user has not gone through Secure Send', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccount2Invite],
    }

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.NONE,
            address: undefined,
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    expect(tree.queryByTestId('accountEditButton')).toBeNull()
  })
})

describe('SendConfirmation with Komenci enabled', () => {
  const komenciEnabled = features.KOMENCI

  beforeAll(() => {
    features.KOMENCI = true
    jest.useRealTimers()
  })

  afterAll(() => {
    features.KOMENCI = komenciEnabled
  })

  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  it('renders correct modal for invitations', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockInviteScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(tree.queryByTestId('InviteAndSendModal')?.props.isVisible).toBe(false)
    fireEvent.press(tree.getByTestId('ConfirmButton'))
    expect(tree.queryByTestId('InviteAndSendModal')?.props.isVisible).toBe(true)
  })
})
