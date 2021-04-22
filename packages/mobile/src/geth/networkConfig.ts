import { Address } from '@celo/base'
import { OdisUtils } from '@celo/identity'
import {
  BIDALI_URL,
  DEFAULT_SYNC_MODE,
  DEFAULT_TESTNET,
  FORNO_ENABLED_INITIALLY,
  GETH_USE_FULL_NODE_DISCOVERY,
  GETH_USE_STATIC_NODES,
  RECAPTCHA_SITE_KEY,
} from 'src/config'
import { GethSyncMode } from 'src/geth/consts'
import Logger from 'src/utils/Logger'

export enum Testnets {
  alfajores = 'alfajores',
  mainnet = 'mainnet',
}

interface NetworkConfig {
  nodeDir: string
  syncMode: GethSyncMode
  initiallyForno: boolean
  blockchainApiUrl: string
  odisUrl: string // Phone Number Privacy service url
  odisPubKey: string
  xanpoolWidgetUrl: string
  moonpayWidgetUrl: string
  signMoonpayUrl: string
  rampWidgetUrl: string
  transakWidgetUrl: string
  useDiscovery: boolean
  useStaticNodes: boolean
  komenciUrl: string
  allowedMtwImplementations: string[]
  currentMtwImplementationAddress: string
  recaptchaSiteKey: string
  bidaliUrl: string
  providerComposerUrl: string
  simplexApiUrl: string
  komenciLoadCheckEndpoint: string
}

const xanpoolWidgetStaging = 'https://checkout.sandbox.xanpool.com'
const xanpoolWidgetProd = 'https://checkout.sandbox.xanpool.com'

const moonpayWidgetStaging = 'https://buy-staging.moonpay.io/'
const moonpayWidgetProd = 'https://buy.moonpay.io/'

const signMoonpayUrlStaging =
  'https://us-central1-celo-testnet-production.cloudfunctions.net/signMoonpayStaging'
const signMoonpayUrlProd =
  'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/signMoonpayProd'

const rampWidgetStaging = 'https://ri-widget-staging.firebaseapp.com'
const rampWidgetProd = 'https://buy.ramp.network'

const transakWidgetProd = 'https://global.transak.com'
const transakWidgetStaging = 'https://staging-global.transak.com'

const KOMENCI_URL_MAINNET = 'https://mainnet-komenci.azurefd.net'
const KOMENCI_URL_STAGING = 'https://staging-komenci.azurefd.net'

const ALLOWED_MTW_IMPLEMENTATIONS_MAINNET: Address[] = [
  '0x6511FB5DBfe95859d8759AdAd5503D656E2555d7',
]
const ALLOWED_MTW_IMPLEMENTATIONS_STAGING: Address[] = [
  '0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A',
  '0x88a2b9B8387A1823D821E406b4e951337fa1D46D',
]

const CURRENT_MTW_IMPLEMENTATION_ADDRESS_MAINNET: Address =
  '0x6511FB5DBfe95859d8759AdAd5503D656E2555d7'
const CURRENT_MTW_IMPLEMENTATION_ADDRESS_STAGING: Address =
  '0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A'

const PROVIDER_URL_COMPOSER_PROD =
  'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/composeCicoProviderUrl'

const PROVIDER_URL_COMPOSER_STAGING =
  'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/composeCicoProviderUrl'

const SIMPLEX_API_URL_STAGING =
  'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/processSimplexRequest'
const SIMPLEX_API_URL_PROD =
  'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/processSimplexRequest'
const KOMENCI_LOAD_CHECK_ENDPOINT_STAGING = 'https://staging-komenci.azurefd.net/v1/ready'
const KOMENCI_LOAD_CHECK_ENDPOINT_PROD = 'https://mainnet-komenci.azurefd.net/v1/ready'

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com/',
    odisUrl: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisPubKey,
    xanpoolWidgetUrl: xanpoolWidgetStaging,
    moonpayWidgetUrl: moonpayWidgetStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    rampWidgetUrl: rampWidgetStaging,
    transakWidgetUrl: transakWidgetStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
    komenciUrl: KOMENCI_URL_STAGING,
    allowedMtwImplementations: ALLOWED_MTW_IMPLEMENTATIONS_STAGING,
    currentMtwImplementationAddress: CURRENT_MTW_IMPLEMENTATION_ADDRESS_STAGING,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    bidaliUrl: BIDALI_URL,
    providerComposerUrl: PROVIDER_URL_COMPOSER_STAGING,
    simplexApiUrl: SIMPLEX_API_URL_STAGING,
    komenciLoadCheckEndpoint: KOMENCI_LOAD_CHECK_ENDPOINT_STAGING,
  },
  [Testnets.mainnet]: {
    nodeDir: `.${Testnets.mainnet}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-mainnet.appspot.com/',
    odisUrl: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisPubKey,
    xanpoolWidgetUrl: xanpoolWidgetProd,
    moonpayWidgetUrl: moonpayWidgetProd,
    signMoonpayUrl: signMoonpayUrlProd,
    rampWidgetUrl: rampWidgetProd,
    transakWidgetUrl: transakWidgetProd,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
    komenciUrl: KOMENCI_URL_MAINNET,
    allowedMtwImplementations: ALLOWED_MTW_IMPLEMENTATIONS_MAINNET,
    currentMtwImplementationAddress: CURRENT_MTW_IMPLEMENTATION_ADDRESS_MAINNET,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    bidaliUrl: BIDALI_URL,
    providerComposerUrl: PROVIDER_URL_COMPOSER_PROD,
    simplexApiUrl: SIMPLEX_API_URL_PROD,
    komenciLoadCheckEndpoint: KOMENCI_LOAD_CHECK_ENDPOINT_PROD,
  },
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
