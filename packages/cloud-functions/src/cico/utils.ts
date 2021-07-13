import BigNumber from 'bignumber.js'
import * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import { bigQueryDataset, bigQueryProjectId, getBigQueryInstance } from '../bigQuery'
import { BLOCKCHAIN_API_URL, FETCH_TIMEOUT_DURATION } from '../config'
import { countryToCurrency } from './providerAvailability'
import { Providers } from './Providers'

const fetch = require('node-fetch')

const bigQuery = getBigQueryInstance()

export const findContinguousSpaces: RegExp = /\s+/g
export interface UserDeviceInfo {
  id: string
  appVersion: string
  userAgent: string
}

interface UserInitData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

interface BlockchainApiExchangeRate {
  data: {
    currencyConversion: {
      rate: number
    }
  }
}

export const getUserInitData = async (
  currentIpAddress: string,
  deviceId: string,
  userAgent: string
): Promise<UserInitData> => {
  const [data] = await bigQuery.query(`
    SELECT context_ip, device_info_user_agent, timestamp
    FROM ${bigQueryProjectId}.${bigQueryDataset}.app_launched
    WHERE user_address = (
        SELECT user_address
        FROM ${bigQueryProjectId}.${bigQueryDataset}.app_launched
        WHERE device_info_unique_id= "${deviceId}"
        AND user_address IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 1
    )
    ORDER BY timestamp ASC
    LIMIT 1
  `)

  if (!data.length) {
    return {
      ipAddress: currentIpAddress,
      timestamp: new Date().toISOString(),
      userAgent,
    }
  }

  const { context_ip, device_info_user_agent, timestamp } = data[0]

  const userInitData = {
    ipAddress: context_ip,
    timestamp: timestamp.value,
    userAgent: device_info_user_agent,
  }

  return userInitData
}

export const getOrCreateUuid = async (userAddress: string) => {
  let simplexId = await admin
    .database()
    .ref(`registrations/${userAddress}/simplexId`)
    .once('value')
    .then((snapshot) => snapshot.val())

  if (simplexId) {
    return simplexId
  }

  simplexId = uuidv4()
  await admin.database().ref(`registrations/${userAddress}`).update({ simplexId })

  return simplexId
}

export const storeTransactionId = async (
  userAddress: string,
  transactionId: string,
  provider: Providers
) => {
  try {
    await admin.database().ref(`cicoProviderTxs/${transactionId}`).update({ provider, userAddress })
  } catch (error) {
    console.error(`Could not store ${provider} transaction id for ${userAddress}`)
  }
}

export const lookupAddressFromTxId = async (transactionId: string): Promise<string | undefined> => {
  const transactionData = await admin
    .database()
    .ref(`cicoProviderTxs/${transactionId}`)
    .once('value')
    .then((snapshot) => snapshot.val())

  if (transactionData?.userAddress) {
    return transactionData.userAddress
  }
}

export function getFirebaseAdminCreds(localAdmin: any) {
  if (!process.env.GCLOUD_PROJECT) {
    try {
      const serviceAccount = require('../../config/serviceAccountKey.json')
      return localAdmin.credential.cert(serviceAccount)
    } catch (error) {
      console.error(
        'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error
      )
    }
  } else {
    try {
      return localAdmin.credential.applicationDefault()
    } catch (error) {
      console.error('Error: Could not retrieve default app creds', error)
    }
  }
}
export const fetchWithTimeout = async (
  url: string,
  body: any | null = null,
  duration: number = FETCH_TIMEOUT_DURATION
): Promise<Response> => {
  try {
    const timeout = new Promise<undefined>((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(Error(`Request timed out after ${duration}ms`))
      }, duration)
    })

    const response = await Promise.race([body ? fetch(url, body) : fetch(url), timeout])
    return response
  } catch (error) {
    throw error
  }
}

const fetchExchangeRate = async (
  sourceCurrencyCode: string,
  localCurrencyCode: string
): Promise<number> => {
  if (sourceCurrencyCode === localCurrencyCode) {
    return 1
  }

  const response: Response = await fetch(BLOCKCHAIN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName: null,
      variables: {},
      query: `{
        currencyConversion(sourceCurrencyCode: "${sourceCurrencyCode}", currencyCode: "${localCurrencyCode}") {
          rate
        }
      }`,
    }),
  })

  const exchangeRate: BlockchainApiExchangeRate = await response.json()
  const rate = exchangeRate?.data?.currencyConversion?.rate
  if (typeof rate !== 'number' && typeof rate !== 'string') {
    throw Error(`Invalid response data ${response}`)
  }

  return new BigNumber(rate).toNumber()
}

export const fetchLocalCurrencyAndExchangeRate = async (
  country: string | null,
  baseCurrency: string,
  localCurrency?: string
) => {
  const result = { localCurrency: baseCurrency, exchangeRate: 1 }

  if (!country) {
    return result
  }

  const localFiatCurrency = localCurrency || countryToCurrency[country]
  if (localFiatCurrency === baseCurrency) {
    return result
  }

  try {
    result.exchangeRate = await fetchExchangeRate(baseCurrency, localFiatCurrency)
    result.localCurrency = localFiatCurrency
  } catch (error) {
    console.error('Error fetching exchange rate: ', error)
  }

  return result
}

export const flattenObject = (obj: any, parent?: string, res: any = {}) => {
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    const propName = parent ? parent + '_' + key : key
    if (obj[key] && typeof obj[key] == 'object') {
      flattenObject(obj[key], propName, res)
    } else {
      res[propName] = obj[key]
    }
  }
  return res
}
