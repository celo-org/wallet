import { CURRENCY_ENUM } from '@celo/utils'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { CurrencyCode } from 'src/config'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const AMOUNT_TO_CASH_IN = 100

const mockScreenProps = (isCashIn: boolean) =>
  getMockStackScreenProps(Screens.ProviderOptionsScreen, {
    isCashIn,
    currency: CURRENCY_ENUM.DOLLAR,
    amount: AMOUNT_TO_CASH_IN,
  })

const mockStore = createMockStore({
  account: {
    defaultCountryCode: '+54',
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.BRL,
  },
})

const SUCCESSFUL_URL_FETCH = JSON.stringify('https://www.moonpay.com/api')

const UNRESTRICTED_USER_LOCATION = JSON.stringify({
  alpha2: 'MX',
  state: null,
})

const MIXED_RESTRICTION_USER_LOCATION = JSON.stringify({
  alpha2: 'US',
  state: 'CA',
})

const RESTRICTED_USER_LOCATION = JSON.stringify({
  alpha2: 'KP',
  state: null,
})

describe('ProviderOptionsScreen', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    mockFetch.resetMocks()
  })

  it('renders correctly', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, MIXED_RESTRICTION_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    await waitForElement(() => tree.getByText('pleaseSelectProvider'))
    expect(tree).toMatchSnapshot()
  })

  it('opens Simplex correctly', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Simplex'))
    expect(navigateToURI).toHaveBeenCalled()
  })

  it('opens MoonPay correctly', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Moonpay'))
    expect(navigate).toHaveBeenCalledWith(Screens.MoonPayScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CurrencyCode.CUSD,
    })
  })

  it('opens Ramp correctly', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Ramp'))
    expect(navigate).toHaveBeenCalledWith(Screens.RampScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CurrencyCode.CUSD,
    })
  })

  it('opens Transak correctly', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    fireEvent.press(tree.getByTestId('Provider/Transak'))
    expect(navigate).toHaveBeenCalledWith(Screens.TransakScreen, {
      localAmount: AMOUNT_TO_CASH_IN,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CurrencyCode.CUSD,
    })
  })

  it('show a warning if user region is not supported', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, RESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('restrictedRegion')
    expect(elements).not.toHaveLength(0)
  })

  it('does not show a warning if user region is supported', async () => {
    mockFetch.mockResponses(SUCCESSFUL_URL_FETCH, UNRESTRICTED_USER_LOCATION)

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const elements = tree.queryAllByText('restrictedRegion')
    expect(elements).toHaveLength(0)
  })

  it('uses country code if IP address endpoint errors', async () => {
    mockFetch.mockReject(new Error('API fetch failed'))

    const tree = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    await waitForElement(() => tree.getByText('pleaseSelectProvider'))

    const element = tree.queryByText('restrictedRegion')
    expect(element).toBeNull()
  })
})
