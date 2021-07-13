import { saveTxHashProvider } from '../firebase'
import { moonpayWebhook } from './moonpayWebhook'
import { Providers } from './Providers'

const mockVerify = jest.fn()

jest.mock('../firebase')
jest.mock('crypto', () => ({
  ...(jest.requireActual('crypto') as any),
  createVerify: jest.fn(() => ({
    update: jest.fn(),
    verify: mockVerify,
  })),
}))
jest.mock('../config', () => ({ MOONPAY_DATA: { webhook_key: 'some_key' } }))

describe('Moonpay cash in', () => {
  const response: any = {
    status: jest.fn(() => response),
    send: jest.fn(),
    end: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /moonpay - success', async () => {
    global.Buffer.compare = () => 0
    const mockMoonpaySignature =
      't=1492774577,s=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd'
    const request: any = {
      body: {
        type: 'mock',
        data: {
          walletAddress: '0x123',
          cryptoTransactionId: '0x456',
        },
      },
      header: (head: string) =>
        head === 'Moonpay-Signature-V2' ? mockMoonpaySignature : undefined,
    }
    await moonpayWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).toHaveBeenCalledTimes(1)
    expect(saveTxHashProvider).toHaveBeenCalledWith('0x123', '0x456', Providers.Moonpay)
  })

  it('POST /moonpay - wrong signature', async () => {
    global.Buffer.compare = () => 1
    const mockMoonpaySignature =
      't=1492774577,s=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd'
    const request: any = {
      body: {
        type: 'mock',
        data: {
          walletAddress: '0x123',
          cryptoTransactionId: '0x456',
        },
      },
      header: (head: string) =>
        head === 'Moonpay-Signature-V2' ? mockMoonpaySignature : undefined,
    }
    await moonpayWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })

  it('POST /moonpay - no tx id', async () => {
    global.Buffer.compare = () => 0
    const mockMoonpaySignature =
      't=1492774577,s=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd'
    const request: any = {
      body: {
        type: 'mock',
        data: {
          walletAddress: '0x123',
          cryptoTransactionId: '',
        },
      },
      header: (head: string) =>
        head === 'Moonpay-Signature-V2' ? mockMoonpaySignature : undefined,
    }
    await moonpayWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })
})
