import { DigitalAsset, FETCH_TIMEOUT_DURATION, XANPOOL_DATA } from '../config'
import { PaymentMethod, UserLocationData } from './fetchProviders'
import { countryToCurrency } from './providerAvailability'
import { fetchWithTimeout } from './utils'

interface XanpoolQuote {
  crypto: number
  fiat: number
  cryptoPrice: number
  cryptoPriceUsd: number
  total: number
  serviceCharge: number
  referralDiscount: number
  referralDiscountInXlp: number
  referralDiscountInUsd: number
  payoutServiceCharge: number
  earnedXlp: number
  processingTime: string
  currency: string
}

const Xanpool = {
  fetchQuote: async (
    digitalAsset: DigitalAsset,
    fiatCurrency: string,
    fiatAmount: number | undefined,
    userLocation: UserLocationData,
    unsupported: boolean
  ) => {
    try {
      if (unsupported || !userLocation.country) {
        throw Error('Location not supported')
      }

      if (!fiatAmount) {
        throw Error('Purchase amount not provided')
      }

      const localFiatCurrency = countryToCurrency[userLocation.country]
      const localFiatCurrencyAmount = fiatAmount

      if (!XANPOOL_DATA.supported_currencies.includes(localFiatCurrency)) {
        throw Error('Currency not supported')
      }

      const url = `
        ${XANPOOL_DATA.api_url}
        /transactions
        /estimate
      `.replace(/\s+/g, '')

      const requestBody = {
        type: 'buy',
        cryptoCurrency: digitalAsset,
        currency: localFiatCurrency,
        fiat: localFiatCurrencyAmount,
      }

      const response: Response = await Xanpool.post(url, requestBody)
      if (!response.ok) {
        throw Error(`Fetch failed with status codes ${response.status}`)
      }

      const bankQuote: XanpoolQuote = await response.json()
      const fee = bankQuote.serviceCharge * bankQuote.cryptoPrice

      return [{
        paymentMethod: PaymentMethod.Bank,
        fee,
        totalAssetsAcquired: bankQuote.total,
      ]
    } catch (error) {
      console.error('Error fetching Transak quote: ', error)
    }
  },
  post: async (path: string, body: any) => {
    try {
      const response = await fetchWithTimeout(
        path,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        FETCH_TIMEOUT_DURATION
      )

      if (!response || !response.ok) {
        throw Error(`Xanpool post request failed with status ${response?.status}`)
      }

      return response
    } catch (error) {
      throw error
    }
  },
}

export default Xanpool
