import { saveTxHashProvider } from '../firebase'
import { Providers } from './Providers'
import { rampWebhook } from './rampWebhook'

const mockVerify = jest.fn()

jest.mock('../firebase')
jest.mock('crypto', () => ({
  ...(jest.requireActual('crypto') as any),
  createVerify: jest.fn(() => ({
    update: jest.fn(),
    verify: mockVerify,
  })),
}))
jest.mock('../config', () => ({ RAMP_DATA: { pem_file: 'rampStaging.pem' } }))
jest.mock('fs', () => ({ readFileSync: jest.fn(() => 'rampKey') }))

describe('Ramp cash in', () => {
  const response: any = {
    status: jest.fn(() => response),
    send: jest.fn(),
    end: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /ramp - success', async () => {
    mockVerify.mockReturnValue(true)
    const request: any = {
      body: {
        type: 'RELEASED',
        purchase: {
          status: 'RELEASING',
          escrowAddress: '0x123',
          networkFee: 0,
          paymentMethodType: 'card',
          purchaseViewToken: 'cusd',
          assetExchangeRateEur: 0.15,
          createdAt: '2021-07-01 12:32',
          receiverAddress: '0x456',
          fiatCurrency: 'EUR',
          actions: [
            {
              timestamp: '2021-07-01 12:32',
              newStatus: 'RELEASING',
            },
          ],
          endTime: '2021-07-01 12:32',
          assetExchangeRate: 1.1,
          fiatExchangeRateEur: 1.14,
          finalTxHash: '0x45463456',
          id: '1',
          asset: {
            address: '0x666',
            symbol: 'cUSD',
            type: 'stablecoin',
            name: 'Celo Dollar',
            decimals: 8,
          },
          cryptoAmount: '10',
          baseRampFee: 0.1,
          fiatValue: 100,
          updatedAt: '2021-07-01 12:32',
          appliedFee: 0,
          hostFeeCut: 0,
        },
      },
      header: (head: string) => (head === 'X-Body-Signature' ? 'test signature' : undefined),
    }
    await rampWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).toHaveBeenCalledTimes(1)
    expect(saveTxHashProvider).toHaveBeenCalledWith('0x456', '0x45463456', Providers.Ramp)
  })

  it('POST /ramp - wrong signature', async () => {
    mockVerify.mockReturnValue(false)
    const request: any = {
      body: {
        type: 'RELEASED',
        purchase: {
          status: 'RELEASING',
          escrowAddress: '0x123',
          networkFee: 0,
          paymentMethodType: 'card',
          purchaseViewToken: 'cusd',
          assetExchangeRateEur: 0.15,
          createdAt: '2021-07-01 12:32',
          receiverAddress: '0x456',
          fiatCurrency: 'EUR',
          actions: [
            {
              timestamp: '2021-07-01 12:32',
              newStatus: 'RELEASING',
            },
          ],
          endTime: '2021-07-01 12:32',
          assetExchangeRate: 1.1,
          fiatExchangeRateEur: 1.14,
          finalTxHash: '0x45463456',
          id: '1',
          asset: {
            address: '0x666',
            symbol: 'cUSD',
            type: 'stablecoin',
            name: 'Celo Dollar',
            decimals: 8,
          },
          cryptoAmount: '10',
          baseRampFee: 0.1,
          fiatValue: 100,
          updatedAt: '2021-07-01 12:32',
          appliedFee: 0,
          hostFeeCut: 0,
        },
      },
      header: (head: string) => (head === 'X-Body-Signature' ? 'test signature' : undefined),
    }
    await rampWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })

  it('POST /ramp - no tx hash', async () => {
    mockVerify.mockReturnValue(true)
    const request: any = {
      body: {
        type: 'INITIALIZED',
        purchase: {
          status: 'INITIALIZED',
          escrowAddress: '0x123',
          networkFee: 0,
          paymentMethodType: 'card',
          purchaseViewToken: 'cusd',
          assetExchangeRateEur: 0.15,
          createdAt: '2021-07-01 12:32',
          receiverAddress: '0x456',
          fiatCurrency: 'EUR',
          actions: [
            {
              timestamp: '2021-07-01 12:32',
              newStatus: 'RELEASING',
            },
          ],
          endTime: '2021-07-01 12:32',
          assetExchangeRate: 1.1,
          fiatExchangeRateEur: 1.14,
          finalTxHash: undefined,
          id: '1',
          asset: {
            address: '0x666',
            symbol: 'cUSD',
            type: 'stablecoin',
            name: 'Celo Dollar',
            decimals: 8,
          },
          cryptoAmount: '10',
          baseRampFee: 0.1,
          fiatValue: 100,
          updatedAt: '2021-07-01 12:32',
          appliedFee: 0,
          hostFeeCut: 0,
        },
      },
      header: (head: string) => (head === 'X-Body-Signature' ? 'test signature' : undefined),
    }
    await rampWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })
})
