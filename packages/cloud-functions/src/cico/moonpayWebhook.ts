import crypto from 'crypto'
import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { MOONPAY_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Providers } from './Providers'
import { flattenObject } from './utils'

const MOONPAY_SIGNATURE_HEADER = 'Moonpay-Signature-V2'
export const MOONPAY_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_moonpay'

// https://www.moonpay.com/dashboard/api_reference/client_side_api/#transactions
interface MoonpayRequestBody {
  externalCustomerId: string | null
  type: MoonpayWebhookType
  data: MoonpayTransaction
}

enum MoonpayWebhookType {
  Started = 'transaction_started',
  Created = 'transaction_created',
  Failed = 'transaction_failed',
  Updated = 'transaction_updated',
  IdCheckUpdated = 'identity_check_updated',
  SellTxCreated = 'sell_transaction_created',
  SellTxUpdated = 'sell_transaction_updated',
  SellTxFailed = 'sell_transaction_failed',
  ExternalToken = 'external_token',
}

interface MoonpayTransaction {
  isFromQuote: boolean
  id: string
  createdAt: string
  updatedAt: string
  baseCurrencyAmount: number
  quoteCurrencyAmount: number
  feeAmount: number
  extraFeeAmount: number
  networkFeeAmount: number
  areFeesIncluded: boolean
  flow: string
  status: MoonpayTxStatus
  walletAddress: string
  walletAddressTag: string
  cryptoTransactionId: string
  failureReason: MoonpayFailureReason
  redirectUrl: string
  returnUrl: string
  widgetRedirectUrl: string
  bankTransferReference: string
  baseCurrencyId: string
  currencyId: string
  customerId: string
  cardId: string
  bankAccountId: string
  eurRate: number
  usdRate: number
  gbpRate: number
  bankDepositInformation: string[]
  externalTransactionId: string
  feeAmountDiscount: string
  baseCurrency: {
    id: string
    createdAt: string
    updatedAt: string
    type: string
    name: string
    code: string
    precision: number
    maxAmount: number
    minAmount: number
  }
  currency: {
    id: string
    createdAt: string
    updatedAt: string
    type: string
    name: string
    code: string
    precision: number
    maxAmount: number
    minAmount: number
    addressRegex: string
    testnetAddressRegex: string
    supportsAddressTag: boolean
    addressTagRegex: string
    supportsTestMode: boolean
    supportsLiveMode: boolean
    isSuspended: boolean
    isSupportedInUS: boolean
    notAllowedUSStates: string[]
    isSellSupported: boolean
    confirmationsRequired: number
  }
  externalCustomerId: string
  escalationReasons?: string[]
  result: string
  rejectType: string
  resultDescription: string
  level: number
  rejections: number
}

enum MoonpayTxStatus {
  WaitingPayment = 'waitingPayment',
  Pending = 'pending',
  WaitingAuthorization = 'waitingAuthorization',
  Failed = 'failed',
  Completed = 'completed',
}

enum MoonpayFailureReason {
  card_not_supported = 'card_not_supported ',
  daily_purchase_limit_exceeded = 'daily_purchase_limit_exceeded ',
  payment_authorization_declined = 'payment_authorization_declined ',
  timeout_3d_secure = 'timeout_3d_secure ',
  timeout_bank_transfer = 'timeout_bank_transfer ',
  timeout_kyc_verification = 'timeout_kyc_verification ',
  timeout_card_verification = 'timeout_card_verification ',
  rejected_kyc = 'rejected_kyc ',
  rejected_card = 'rejected_card ',
  rejected_other = 'rejected_other ',
  cancelled = 'cancelled ',
  refund = 'refund ',
  failed_testnet_withdrawal = 'failed_testnet_withdrawal ',
  error = 'error ',
}

const verifyMoonPaySignature = (signatureHeader: string | undefined, body: string) => {
  if (!signatureHeader) {
    return false
  }

  const [first, second] = signatureHeader.split(',')
  const timestamp = first.split('=')[1]
  const signature = second.split('=')[1]
  const signedPayload = `${timestamp}.${body}`

  const hmac = crypto.createHmac('sha256', MOONPAY_DATA.webhook_key)
  hmac.write(signedPayload)
  hmac.end()

  const expectedSignature = Buffer.from(hmac.read().toString('hex'))
  const signatureBuffer = Buffer.from(signature)
  return Buffer.compare(signatureBuffer, expectedSignature) === 0
}

export const parseMoonpayEvent = async (reqBody: any) => {
  const { type, data, externalCustomerId }: MoonpayRequestBody = reqBody
  const { walletAddress, cryptoTransactionId, status } = data
  console.info(`Received ${type} event with status ${status} for ${walletAddress}`)

  if (cryptoTransactionId) {
    saveTxHashProvider(walletAddress, cryptoTransactionId, Providers.Moonpay)
  }

  const flattenedData = flattenObject({
    ...data,
    bankDepositInformation: JSON.stringify(data?.bankDepositInformation),
    currency: {
      ...data.currency,
      notAllowedUSStates: JSON.stringify(data?.currency?.notAllowedUSStates),
    },
    escalationReasons: JSON.stringify(data?.escalationReasons),
  })

  await trackEvent(MOONPAY_BIG_QUERY_EVENT_TABLE, {
    type,
    externalCustomerId,
    ...flattenedData,
  })
}

export const moonpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const validSignature = verifyMoonPaySignature(
      req.header(MOONPAY_SIGNATURE_HEADER),
      JSON.stringify(req.body)
    )

    if (!validSignature) {
      throw new Error('Invalid or missing signature')
    }

    await parseMoonpayEvent(req.body)

    res.status(204).send()
  } catch (error) {
    console.error('Error parsing webhook event: ', JSON.stringify(error))
    console.info('Request body: ', JSON.stringify(req.body))
    res.status(400).end()
  }
})
