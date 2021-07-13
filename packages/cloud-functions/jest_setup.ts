import { enableFetchMocks } from 'jest-fetch-mock'

enableFetchMocks()

jest.mock('firebase-functions', () => ({
  https: {
    onRequest: jest.fn,
  },
  database: {
    ref: () => ({
      onWrite: jest.fn,
    }),
  },
  pubsub: {
    schedule: () => ({
      onRun: jest.fn,
    }),
  },
  config: jest.fn(() => ({
    moonpay: {
      widget_url: 'moonpay.com',
      api_url: 'api.moonpay.com',
      public_key: 'moonpay public key',
      private_key: 'moonpay private key',
      webhook_key: 'moonpay webhook key',
    },
    ramp: {
      widget_url: 'ramp.com',
      public_key: 'ramp public key',
      pem_file: 'ramp pem file',
      webhook_key: 'ramp webhook key',
    },
    transak: {
      widget_url: 'transak.com',
      api_url: 'api.transak.com',
      public_key: 'transak public key',
      private_key: 'transak private key',
    },
    simplex: {
      widget_url: 'simplex.com',
      checkout_url: 'checkout.simplex.com',
      api_key: 'simplex api key',
    },
    xanpool: {
      widget_url: 'xanpool.com',
      api_url: 'api.xanpool.com',
      public_key: 'xanpool public key',
      private_key: 'xanpool private key',
    },
    blockchain_api: {
      url: 'blockchain.api.com',
    },
    full_node: {
      url: 'forno.celo.org',
    },
    ip_api: {
      key: 'IP API KEY',
    },
  })),
}))

jest.mock('./src/bigQuery', () => ({
  trackEvent: jest.fn(
    () => new Promise<void>((res) => res())
  ),
  getBigQueryInstance: jest.fn(() => ({
    query: jest.fn(() => ({
      ipAddress: '1.0.0.0',
      timestamp: '2021-07-01 12:32',
      userAgent: 'MAC SOMETHING SOMETHING',
    })),
  })),
}))
