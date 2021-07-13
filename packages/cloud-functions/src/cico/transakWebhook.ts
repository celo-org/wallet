import * as functions from 'firebase-functions'
import jwt from 'jsonwebtoken'
import { trackEvent } from '../bigQuery'
import { TRANSAK_DATA } from '../config'
import { saveTxHashProvider } from '../firebase'
import { Providers } from './Providers'

const TRANSAK_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_transak'

interface TransakEventPayload {
  eventID: TransakEvent
  createdAt: string
  webhookData: {
    id: string
    walletAddress: string
    createdAt: string
    status: TransakStatus
    fiatCurrency: string
    cryptoCurrency: string
    isBuyOrSell: 'BUY' | 'SELL'
    fiatAmount: number
    walletLink: string
    paymentOptionId: string
    quoteId: string
    addressAdditionalData: boolean
    network: string
    cryptocurrency: string
    amountPaid: number
    redirectURL: string
    conversionPrice: number
    cryptoAmount: number
    totalFeeInFiat: number
    fiatAmountInUsd: number
    fromWalletAddress: boolean
    fiatliquidityProviderData: {
      reservationData: {
        url: string
        reservation: string
      }
      cardProcessingFormData: {
        debitCard: string
        reservationId: string
        amount: string
        sourceCurrency: string
        destCurrency: string
        dest: string
        referrerAccountId: string
        givenName: string
        familyName: string
        email: string
        phone: string
        address: {
          street1: string
          city: string
          state: string
          postalCode: string
          country: string
        }
      }
      isTestEnv: boolean
      referrerAccountId: string
      name: string
      logo: string
      preAuthData:
        | {
            walletOrderId: string
          }
        | undefined
      walletOrderData:
        | {
            id: string
            createdAt: string
            owner: string
            status: string
            orderType: string
            sourceAmount: string
            purchaseAmount: string
            sourceCurrency: string
            destCurrency: string
            transferId: string
            dest: string
            authCodesRequested: boolean
            blockchainNetworkTx: string
            accountId: string
            paymentMethodName: string
            updatedAt: string
          }
        | undefined
      authorizationData:
        | {
            walletOrderId: string
            smsNeeded: boolean
            card2faNeeded: boolean
            authorization3dsUrl: string
          }
        | undefined
      transferData:
        | {
            transferId: string
            feeCurrency: string
            fee: string
            fees: {
              USD: string
              ETH: string
            }
            sourceCurrency: string
            destCurrency: string
            sourceAmount: string
            destAmount: string
            destSrn: string
            pusherChannel: string
            from: string
            to: string
            rate: string
            customId: string
            blockchainNetworkTx: string
            message: string
            transferHistoryEntryType: string
            successTimeline: {
              statusDetails: string
              state: string
              createdAt: string
            }[]
            failedTimeline: string[]
            failureReason: string
            reversalReason: string
          }
        | undefined
    }
    isNonCustodial: boolean
    transactionHash: string
    transactionLink: string
    completedAt: string
    partnerFeeInLocalCurrency: number
    statusReason: string
    statusHistories: {
      status: string
      createdAt: string
      message: string
      isEmailSentToUser: boolean
      partnerEventId: string
    }[]
  }
}

enum TransakEvent {
  Created = 'ORDER_CREATED',
  Processing = 'ORDER_COMPLETED',
  PaymentVerifying = 'ORDER_PAYMENT_VERIFYING',
  Completed = 'ORDER_COMPLETED',
  Failed = 'ORDER_FAILED',
}

enum TransakStatus {
  PROCESSING = 'PROCESSING',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  PENDING_DELIVERY_FROM_TRANSAK = 'PENDING_DELIVERY_FROM_TRANSAK',
  PAYMENT_DONE_MARKED_BY_USER = 'PAYMENT_DONE_MARKED_BY_USER',
  AWAITING_PAYMENT_FROM_USER = 'AWAITING_PAYMENT_FROM_USER',
}

export const parseTransakEvent = async (reqBody: TransakEventPayload) => {
  const {
    eventID,
    webhookData: { walletAddress, status, transactionHash },
  } = reqBody

  console.info(`Received ${eventID} event with status ${status} for ${walletAddress}`)

  if (transactionHash) {
    saveTxHashProvider(walletAddress, transactionHash, Providers.Transak)
  }

  const data = (() => {
    const dataObj: any = {}
    if (reqBody) {
      for (const [key, value] of Object.entries(reqBody.webhookData)) {
        // Removing sensetive props and avoiding a duplicate cryptocurrency prop
        if (
          key !== 'cryptocurrency' &&
          key !== 'fiatliquidityProviderData' &&
          key !== 'statusHistories'
        ) {
          dataObj[key] = value
        }
      }

      // Add relevant data from parent object and omit `fiatliquidityProviderData` object
      dataObj.eventID = eventID
      dataObj.liquidityProvider = reqBody.webhookData?.fiatliquidityProviderData?.name
      dataObj.failureReason =
        reqBody.webhookData?.fiatliquidityProviderData?.transferData?.failureReason
    }
    return dataObj
  })()

  await trackEvent(TRANSAK_BIG_QUERY_EVENT_TABLE, data)
}

export const transakWebhook = functions.https.onRequest(async (request, response) => {
  let decodedData: TransakEventPayload | null = null

  try {
    decodedData = jwt.verify(request.body.data, TRANSAK_DATA.private_key) as TransakEventPayload

    await parseTransakEvent(decodedData)

    response.status(204).send()
  } catch (error) {
    console.error('Error parsing webhook event', JSON.stringify(error))
    console.info('Request body: ', JSON.stringify(decodedData))
    response.status(400).send()
  }
})
