import * as functions from 'firebase-functions'
import { trackEvent } from '../bigQuery'
import { SIMPLEX_DATA } from '../config'
import { fetchWithTimeout, flattenObject, lookupAddressFromTxId } from './utils'

const SIMPLEX_BIG_QUERY_EVENT_TABLE = 'cico_provider_events_simplex'

// https://integrations.simplex.com/wallet-api-integration#events-api_group
interface SimplexEventPayload {
  events: SimplexTransactionEvent[]
}

interface SimplexTransactionEvent {
  event_id: string
  name: SimplexTxStatus
  payment: {
    id: string
    status: string
    created_at: string
    partner_id: number
    updated_at: string
    crypto_currency: string
    fiat_total_amount: {
      amount: number
      currency: string
    }
    crypto_total_amount: {
      amount: number
      currency: string
    }
    partner_end_user_id: string
  }
  timestamp: string
}

enum SimplexTxStatus {
  Started = 'payment_request_submitted',
  Completed = 'payment_simplexcc_approved',
  Failed = 'payment_simplexcc_declined',
}

const getSimplexEvents = async () => {
  const response = await fetchWithTimeout(SIMPLEX_DATA.event_url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
    },
  })

  if (!response.ok) {
    throw new Error(JSON.stringify(response))
  }

  const simplexEvents: SimplexEventPayload = await response.json()
  return simplexEvents
}

const deleteSimplexEvent = async (event: SimplexTransactionEvent) => {
  try {
    await fetchWithTimeout(`${SIMPLEX_DATA.event_url}/${event.event_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
      },
    })
  } catch (error) {
    console.error('Delete error: ', JSON.stringify(error))
    throw error
  }
}

export const simplexEventPolling = functions.https.onRequest(async (req, res) => {
  try {
    const simplexEvents = await getSimplexEvents()

    await Promise.all(
      simplexEvents.events.map(async (event) => {
        try {
          const txId = event.payment.id
          const userAddress = await lookupAddressFromTxId(txId)

          userAddress
            ? console.info(`Found user address ${userAddress} on txId ${txId}`)
            : console.info(`No user address found for txId ${txId}`)

          await trackEvent(SIMPLEX_BIG_QUERY_EVENT_TABLE, flattenObject({ userAddress, ...event }))
          await deleteSimplexEvent(event)
        } catch (error) {
          console.error('Error with event: ', JSON.stringify(event))
        }
      })
    )

    res.status(204).end()
  } catch (error) {
    console.error('Error querying for Simplex events: ', error)
    res.status(400).end()
  }
})
