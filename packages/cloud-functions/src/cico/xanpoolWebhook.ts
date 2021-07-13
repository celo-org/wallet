import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { flattenObject } from './utils'

const XANPOOL_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_xanpool'

interface XanpoolEventPayload {
  timestamp: number
  message: string
  payload: {
    id: string
    type: string
    status: string
    method: string
    crypto: number
    fiat: number
    total: number
    currency: string
    cryptoCurrency: string
    serviceCharge: number
    cryptoPrice: number
    cryptoPriceUsd: number
    nonce: string
    qrCode: string
    wallet: string
    userCountry: string
    userId: string
    peer: {
      account: string
    }
    blockchainTxId: string
    depositWallets: {
      celo: string
    }
  }
}

export const parseXanpoolEvent = async (reqBody: any) => {
  const { timestamp, message, payload }: XanpoolEventPayload = reqBody
  const data = flattenObject({ timestamp, message, ...payload })
  await trackEvent(XANPOOL_BIG_QUERY_EVENT_TABLE, data)
}

// This needs to be all lowercase due to a bug in Xanpool's dashboard
export const xanpoolwebhook = functions.https.onRequest(async (req, res) => {
  try {
    await parseXanpoolEvent(req.body)

    res.status(204).send()
  } catch (error) {
    console.error('Error parsing webhook event: ', JSON.stringify(error))
    console.info('Request body: ', JSON.stringify(req.body))
    res.status(400).end()
  }
})
