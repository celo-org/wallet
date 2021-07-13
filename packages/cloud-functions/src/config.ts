import * as functions from 'firebase-functions'
import i18next from 'i18next'

// This allows us to access Cloud Function environment variables
const config = functions.config()

export const IP_API_KEY = config.ip_api?.key

export const MOONPAY_DATA = {
  widget_url: config.moonpay?.widget_url,
  api_url: config.moonpay?.api_url,
  public_key: config.moonpay?.public_key,
  private_key: config.moonpay?.private_key,
  webhook_key: config.moonpay?.webhook_key,
  supported_currencies: ['USD', 'EUR', 'GBP'],
}

export const RAMP_DATA = {
  widget_url: config.ramp?.widget_url,
  public_key: config.ramp?.public_key,
  pem_file: config.ramp?.pem_file,
  webhook_url: config.ramp?.webhook_url,
}

export const TRANSAK_DATA = {
  widget_url: config.transak?.widget_url,
  api_url: config.transak?.api_url,
  public_key: config.transak?.public_key,
  private_key: config.transak?.private_key,
}

export const SIMPLEX_DATA = {
  api_url: config.simplex?.api_url,
  checkout_url: config.simplex?.checkout_url,
  event_url: config.simplex?.event_url,
  api_key: config.simplex?.api_key,
}

export const XANPOOL_DATA = {
  widget_url: config.xanpool?.widget_url,
  api_url: config.xanpool?.api_url,
  public_key: config.xanpool?.public_key,
  private_key: config.xanpool?.private_key,
  supported_currencies: ['IDR', 'VND', 'SGD', 'HKD', 'TBH', 'INR', 'MYR', 'PHP'],
}

export const BLOCKCHAIN_API_URL = config.blockchain_api?.url
export const FULL_NODE_URL = config.full_node?.url

export const VALORA_LOGO_URL =
  'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png'

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'
export const CASH_IN_FAILURE_DEEPLINK = 'celo://wallet/cash-in-failure'

export const CASH_IN_SUCCESS_URL = 'https://valoraapp.com/?done=true'

export const BIGQUERY_PROVIDER_STATUS_TABLE = 'cico_provider_status'

export enum FiatCurrency {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  MXN = 'MXN',
  COP = 'COP',
  PHP = 'PHP',
  LRD = 'LRD',
  SLL = 'SLL',
  KES = 'KES',
  UGX = 'UGX',
  GHS = 'GHS',
  NGN = 'NGN',
  BRL = 'BRL',
  CVE = 'CVE',
  AUD = 'AUD',
}

export enum DigitalAsset {
  CELO = 'CELO',
  CUSD = 'CUSD',
}

export const FETCH_TIMEOUT_DURATION = 10000 // 10 seconds
export const NOTIFICATIONS_TTL_MS = 3600 * 1000 * 24 * 7 // 1 week in milliseconds

const en = require('../locales/en.json')
const es = require('../locales/es.json')
const pt = require('../locales/pt.json')

i18next
  .init({
    lng: 'en',
    resources: {
      en: {
        translation: en,
      },
      es: {
        translation: es,
      },
      pt: {
        translation: pt,
      },
    },
    fallbackLng: {
      default: ['en'],
    },
  })
  .catch((reason: any) => console.error('Config', 'Failed to init i18n', reason))
