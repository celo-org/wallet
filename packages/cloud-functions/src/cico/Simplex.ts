import { v4 as uuidv4 } from 'uuid'
import {
  CASH_IN_FAILURE_DEEPLINK,
  CASH_IN_SUCCESS_DEEPLINK,
  DigitalAsset,
  FiatCurrency,
  SIMPLEX_DATA,
} from '../config'
import { UserDeviceInfo } from './composeCicoProviderUrl'
import { Providers } from './Providers'
import { fetchWithTimeout, getOrCreateUuid, getUserInitData, storeTransactionId } from './utils'

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

export interface SimplexPaymentRequestResponse {
  is_kyc_update_required: boolean
}

export interface SimplexPaymentData {
  orderId: string
  paymentId: string
  checkoutHtml: string
}

export const Simplex = {
  fetchQuote: async (
    userAddress: string,
    ipAddress: string | null,
    currencyToBuy: DigitalAsset,
    fiatCurrency: FiatCurrency,
    amount: number | undefined,
    amountIsFiat: boolean
  ) => {
    try {
      if (!ipAddress) {
        throw Error('No IP address provided')
      }

      if (!amount) {
        throw Error('No purchase amount provided')
      }

      const userUuid = await getOrCreateUuid(userAddress)
      const simplexQuote: SimplexQuote = await Simplex.post(
        `${SIMPLEX_DATA.api_url}/wallet/merchant/v2/quote`,
        {
          end_user_id: userUuid,
          digital_currency: currencyToBuy,
          fiat_currency: fiatCurrency,
          requested_currency: amountIsFiat ? fiatCurrency : currencyToBuy,
          requested_amount: amount,
          wallet_id: 'valorapp',
          client_ip: ipAddress,
          payment_methods: ['credit_card'],
        }
      )

      return simplexQuote
    } catch (error) {
      console.error('Error fetching Simplex quote: ', error)
    }
  },
  fetchPaymentRequest: async (
    userAddress: string,
    phoneNumber: string | null,
    phoneNumberVerified: boolean,
    simplexQuote: SimplexQuote,
    currentIpAddress: string,
    deviceInfo: UserDeviceInfo
  ) => {
    try {
      const paymentId = uuidv4()
      const orderId = uuidv4()

      const { id, appVersion, userAgent } = deviceInfo
      const accountCreationData = await getUserInitData(currentIpAddress, id, userAgent)
      const userUuid = await getOrCreateUuid(userAddress)
      await storeTransactionId(userAddress, paymentId, Providers.Simplex)

      const simplexPaymentRequestResponse: SimplexPaymentRequestResponse = await Simplex.post(
        `${SIMPLEX_DATA.api_url}/wallet/merchant/v2/payments/partner/data`,
        {
          account_details: {
            app_provider_id: 'valorapp',
            app_end_user_id: userUuid,
            app_version_id: appVersion,
            app_install_date: accountCreationData.timestamp,
            email: '',
            phone: phoneNumber || '',
            verified_details: [
              // 'email', Currently no way to verify email in Valora
              phoneNumberVerified && 'phone',
            ].filter((_) => !!_),
            signup_login: {
              ip: accountCreationData.ipAddress,
              user_agent: accountCreationData.userAgent,
              timestamp: accountCreationData.timestamp,
            },
          },
          transaction_details: {
            payment_details: {
              quote_id: simplexQuote.quote_id,
              payment_id: paymentId,
              order_id: orderId,
              destination_wallet: {
                currency: simplexQuote.digital_money.currency,
                address: userAddress,
                tag: '',
              },
              original_http_ref_url: 'https://valoraapp.com',
            },
          },
        }
      )

      if (simplexPaymentRequestResponse.is_kyc_update_required === undefined) {
        throw Error('Simplex payment request failed')
      }

      const checkoutHtml = Simplex.generateCheckoutForm(paymentId)
      const simplexPaymentData: SimplexPaymentData = { paymentId, orderId, checkoutHtml }
      return simplexPaymentData
    } catch (error) {
      console.error('Error fetching Simplex payment request: ', error)
    }
  },
  generateCheckoutForm: (paymentId: string) => `
    <html>
      <body>
        <form id="payment_form" action="${SIMPLEX_DATA.checkout_url}/payments/new" method="post">
          <input type="hidden" name="version" value="1">
          <input type="hidden" name="partner" value="valorapp">
          <input type="hidden" name="payment_flow_type" value="wallet">
          <input type="hidden" name="return_url_success" value="${CASH_IN_SUCCESS_DEEPLINK}/simplex">
          <input type="hidden" name="return_url_fail" value="${CASH_IN_FAILURE_DEEPLINK}/simplex">
          <input type="hidden" name="payment_id" value="${paymentId}">
        </form>
        <script type="text/javascript">
          document.forms["payment_form"].submit();
        </script>
      </body>
    </html>
  `,
  post: async (path: string, body: any) => {
    try {
      const response = await fetchWithTimeout(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) {
        throw Error(`Response body ${JSON.stringify(data)}`)
      }

      return data
    } catch (error) {
      console.error(`Simplex post request failed.\nURL: ${path}\n`, error)
      throw error
    }
  },
}
