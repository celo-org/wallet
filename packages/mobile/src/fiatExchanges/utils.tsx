import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import firebase from '@react-native-firebase/app'
import { default as DeviceInfo } from 'react-native-device-info'
import getIpAddress from 'react-native-public-ip'
import { CurrencyCode, MOONPAY_API_KEY } from 'src/config'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoProvider } from 'src/fiatExchanges/ProviderOptionsScreen'
import { CURRENCY_ENUM } from 'src/geth/consts'
import networkConfig from 'src/geth/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'

const FETCH_TIMEOUT_DURATION = 15000 // 15 seconds

const TAG = 'fiatExchanges:utils'

interface ProviderRequestData {
  userLocation: UserLocationData
  walletAddress: string
  fiatCurrency: LocalCurrencyCode
  digitalAsset: CurrencyCode
  fiatAmount?: number
  digitalAssetAmount?: number
}

export interface UserLocationData {
  country: string | null
  state: string | null
  ipAddress: string | null
}

export interface UserAccountCreationData {
  ipAddress: string
  timestamp: string
  userAgent: string
}
interface MoonPayIpAddressData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
}

export interface ProviderQuote {
  paymentMethod: PaymentMethod
  digitalAsset: string
  digitalAssetsAmount: number
  fiatCurrency: string
  fiatFee: number
}

export interface SimplexQuote {
  user_id: string
  quote_id: string
  wallet_id: string
  digital_money: {
    currency: string
    amount: number
  }
  fiat_money: {
    currency: string
    base_amount: number
    total_amount: number
  }
  valid_until: string
  supported_digital_currencies: string[]
}
export interface LocalCicoProvider {
  name: string
  celo: {
    cashIn: boolean
    cashOut: boolean
    countries: string[]
    url: string
  }
  cusd: {
    cashIn: boolean
    cashOut: boolean
    countries: string[]
    url: string
  }
}

interface SimplexPaymentData {
  orderId: string
  paymentId: string
  checkoutHtml: string
}

const composePostObject = (body: any) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

export const fetchProviders = async (
  requestData: ProviderRequestData
): Promise<CicoProvider[] | undefined> => {
  try {
    const response = await fetchWithTimeout(
      networkConfig.providerFetchUrl,
      composePostObject(requestData),
      FETCH_TIMEOUT_DURATION
    )

    if (!response || !response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    return response.json()
  } catch (error) {
    Logger.error(`${TAG}:fetchProviders`, error.message)
    throw error
  }
}

export const fetchUserLocationData = async (countryCallingCode: string | null) => {
  let userLocationData: UserLocationData
  try {
    const response = await fetchWithTimeout(
      `https://api.moonpay.com/v4/ip_address?apiKey=${MOONPAY_API_KEY}`,
      null,
      FETCH_TIMEOUT_DURATION
    )

    if (!response || !response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    const locationData: MoonPayIpAddressData = await response.json()
    const { alpha2, state, ipAddress } = locationData

    if (!alpha2) {
      throw Error('Could not determine country from IP address')
    }

    userLocationData = { country: alpha2, state, ipAddress }
  } catch (error) {
    Logger.error(`${TAG}:fetchUserLocationData`, error.message)
    // If MoonPay endpoint fails then use country code to determine location
    const country = countryCallingCode ? getRegionCodeFromCountryCode(countryCallingCode) : null
    let ipAddress
    try {
      ipAddress = await getIpAddress()
    } catch (error) {
      ipAddress = null
    }

    userLocationData = { country, state: null, ipAddress }
  }

  return userLocationData
}

export const fetchSimplexPaymentData = async (
  userAddress: string,
  phoneNumber: string | null,
  phoneNumberVerified: boolean,
  simplexQuote: SimplexQuote,
  currentIpAddress: string
) => {
  try {
    const response = await fetchWithTimeout(
      networkConfig.simplexApiUrl,
      composePostObject({
        type: 'payment',
        userAddress,
        phoneNumber,
        phoneNumberVerified,
        simplexQuote,
        currentIpAddress,
        deviceInfo: {
          id: DeviceInfo.getUniqueId(),
          appVersion: DeviceInfo.getVersion(),
          userAgent: DeviceInfo.getUserAgentSync(),
        },
      }),
      FETCH_TIMEOUT_DURATION
    )

    if (!response || !response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    const simplexPaymentDataResponse = await response.json()
    if (simplexPaymentDataResponse?.error) {
      throw Error(simplexPaymentDataResponse.error)
    }

    const simplexPaymentData: SimplexPaymentData = simplexPaymentDataResponse
    return simplexPaymentData
  } catch (error) {
    Logger.error(`${TAG}:fetchSimplexPaymentData`, error.message)
    throw error
  }
}

export const isSimplexQuote = (quote?: SimplexQuote | ProviderQuote): quote is SimplexQuote =>
  !!quote && 'wallet_id' in quote

export const isProviderQuote = (quote?: SimplexQuote | ProviderQuote): quote is ProviderQuote =>
  !!quote && 'digitalAssetsAmount' in quote

// Leaving unoptimized for now because sorting is most relevant when fees will be visible
export const sortProviders = (provider1: CicoProvider, provider2: CicoProvider) => {
  if (provider1.unavailable) {
    return 1
  }

  if (provider2.unavailable) {
    return -1
  }

  if (provider1.restricted) {
    return 1
  }

  if (provider2.restricted) {
    return -1
  }

  if (!provider1.quote) {
    return 1
  }

  if (!provider2.quote) {
    return -1
  }

  if (isSimplexQuote(provider1.quote) && isProviderQuote(provider2.quote)) {
    return provider1.quote.digital_money.amount - provider2.quote.digitalAssetsAmount
  }

  if (isProviderQuote(provider1.quote) && isSimplexQuote(provider2.quote)) {
    return provider1.quote.digitalAssetsAmount - provider2.quote.digital_money.amount
  }

  return 0
}

const typeCheckNestedProperties = (obj: any, property: string) =>
  obj[property] &&
  typeof obj[property].cashIn === 'boolean' &&
  typeof obj[property].cashOut === 'boolean' &&
  typeof obj[property].url === 'string' &&
  obj[property].countries instanceof Array &&
  obj[property].countries.every(
    (country: any) => typeof country === 'string' && country.length === 2
  )

const isLocalCicoProvider = (obj: any): obj is LocalCicoProvider => {
  return (
    typeof obj.name === 'string' &&
    typeCheckNestedProperties(obj, 'celo') &&
    typeCheckNestedProperties(obj, 'cusd')
  )
}

export const fetchLocalCicoProviders = async () => {
  const firebaseLocalProviders: any[] = await firebase
    .database()
    .ref('localCicoProviders')
    .once('value')
    .then((snapshot) => snapshot.val())
    .then((providers) =>
      Object.entries(providers).map(([name, values]: [string, any]) => ({
        ...values,
        name,
      }))
    )

  const localCicoProviders: LocalCicoProvider[] = firebaseLocalProviders.filter((provider) =>
    isLocalCicoProvider(provider)
  )

  return localCicoProviders
}

export const getAvailableLocalProviders = (
  localCicoProviders: LocalCicoProvider[] | undefined,
  isCashIn: boolean,
  countryCode: string | null,
  selectedCurrency: CURRENCY_ENUM
) => {
  if (!localCicoProviders || !countryCode) {
    return []
  }

  const activeLocalProviders = localCicoProviders.filter(
    (provider) =>
      (isCashIn && (provider.cusd.cashIn || provider.celo.cashIn)) ||
      (!isCashIn && (provider.cusd.cashOut || provider.celo.cashOut))
  )

  let availableLocalProviders: LocalCicoProvider[] = []

  const regionCode = getRegionCodeFromCountryCode(countryCode)
  if (regionCode) {
    availableLocalProviders = activeLocalProviders.filter((provider) =>
      provider[selectedCurrency === CURRENCY_ENUM.DOLLAR ? 'cusd' : 'celo'].countries.includes(
        regionCode
      )
    )
  }

  return availableLocalProviders
}
