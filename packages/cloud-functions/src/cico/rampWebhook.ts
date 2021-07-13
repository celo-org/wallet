import crypto from 'crypto'
import stableStringify from 'fast-json-stable-stringify'
import * as functions from 'firebase-functions'
import { readFileSync } from 'fs'
import { trackEvent } from '../bigQuery'
import { RAMP_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Providers } from './Providers'
import { flattenObject } from './utils'

const RAMP_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_ramp'
const RAMP_KEY = RAMP_DATA.pem_file
  ? readFileSync(`./config/${RAMP_DATA.pem_file}`).toString()
  : null
const RAMP_SIGNATURE_HEADER = 'X-Body-Signature'

interface RampRequestBody {
  type: RampWebhookType
  purchase: RampPurchase
}

enum RampWebhookType {
  Created = 'CREATED',
  Released = 'RELEASED',
  Returned = 'RETURNED',
  Error = 'ERROR',
}

interface RampPurchase {
  status: PurchaseStatus
  escrowAddress: string | null
  networkFee: number
  paymentMethodType: string
  purchaseViewToken: string
  assetExchangeRateEur: number
  createdAt: string
  receiverAddress: string
  fiatCurrency: string
  actions: RampAction[]
  endTime: string
  assetExchangeRate: number
  fiatExchangeRateEur: number
  finalTxHash?: string
  id: string
  asset: AssetInfo
  cryptoAmount: string
  baseRampFee: number
  fiatValue: number
  updatedAt: string
  appliedFee: number
  hostFeeCut: number
}
interface RampAction {
  timestamp: string
  newStatus: string
}

enum PurchaseStatus {
  Initialized = 'INITIALIZED', // The purchase was initialized.
  PaymentStarted = 'PAYMENT_STARTED', // An automated payment was initiated, eg. via card or open banking.
  PaymentInProgress = 'PAYMENT_IN_PROGRESS', // User completed the payment process.
  PaymentFailed = 'PAYMENT_FAILED', // The last payment was cancelled, rejected, or otherwise failed.
  PaymentExecuted = 'PAYMENT_EXECUTED', // The last payment was successful.
  FiatSent = 'FIAT_SENT', // Outgoing bank transfer was confirmed on the buyer's account.
  FiatReceived = 'FIAT_RECEIVED', // Payment was confirmed, final checks before crypto transfer.
  Releasing = 'RELEASING', // Crypto release started – transfer transaction or escrow release() tx was sent.
  Released = 'RELEASED', // Crypto asset was confirmed to be transferred to the buyer. A terminal state.
  Expired = 'EXPIRED', // The time to pay for the purchase was exceeded. A terminal state.
  Cancelled = 'CANCELLED', // The purchase was cancelled and won't be continued. A terminal state.
}

interface AssetInfo {
  address: string | null // 0x-prefixed address for ERC-20 tokens, `null` for ETH
  symbol: string // asset symbol, for example `ETH`, `DAI`, `USDC`
  type: string
  name: string
  decimals: number // token decimals, e.g. 18 for ETH/DAI, 6 for USDC
}

const verifyRampSignature = (signature: string | undefined, body: RampRequestBody) => {
  if (!signature || !body || !RAMP_KEY) {
    return false
  }

  const verifier = crypto.createVerify('sha256')
  verifier.update(Buffer.from(stableStringify(body)))
  return verifier.verify(RAMP_KEY, signature, 'base64')
}

export const parseRampEvent = async (reqBody: any) => {
  const { type, purchase }: RampRequestBody = reqBody
  const { receiverAddress, finalTxHash, status } = purchase
  console.info(`Received ${type} event with status ${status} for ${receiverAddress}`)

  if (type === RampWebhookType.Released && finalTxHash) {
    console.info(`Tx hash: ${finalTxHash}`)
    saveTxHashProvider(receiverAddress, finalTxHash, Providers.Ramp)
  }

  // Converting actions array to string to allow for easy storage
  const data = flattenObject({ type, ...purchase, actions: JSON.stringify(purchase.actions) })
  await trackEvent(RAMP_BIG_QUERY_EVENT_TABLE, data)
}

export const rampWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const validSignature = verifyRampSignature(req.header(RAMP_SIGNATURE_HEADER), req.body)
    if (!validSignature) {
      throw new Error('Invalid or missing signature')
    }

    await parseRampEvent(req.body)

    res.status(204).send()
  } catch (error) {
    console.error('Error parsing webhook event: ', JSON.stringify(error))
    console.info('Request body: ', JSON.stringify(req.body))
    res.status(400).end()
  }
})
