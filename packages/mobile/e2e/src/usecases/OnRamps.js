import { dismissBanners } from '../utils/banners'
import { pixelDiff, getDeviceModel } from '../utils/utils'

export default onRamps = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('addFunds')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Debt Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('$50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await waitFor(element(by.id('Provider/Moonpay')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        const imagePath = await device.takeScreenshot('cUSD In Providers')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/cUSD In Providers.png`)
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('$50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await waitFor(element(by.id('Provider/Moonpay')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        await expect(element(by.id('Icon/Moonpay'))).toExist()
        await expect(element(by.id('Icon/Simplex'))).toExist()
        await expect(element(by.id('Icon/Xanpool'))).toExist()
        await expect(element(by.id('Icon/Ramp'))).toExist()
        await expect(element(by.id('Icon/Transak'))).toExist()
        const imagePath = await device.takeScreenshot('cUSD In Providers')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/cUSD In Providers.png`)
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Exchanges & Account Key', async () => {
        await waitFor(element(by.id('Bittrex')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('accountBox'))).toBeVisible()
        const imagePath = await device.takeScreenshot('cUSD Exchanges')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/cUSD Exchanges.png`)
      })
    })
  })

  describe('CELO', () => {
    beforeEach(async () => {
      await element(by.id('radio/CELO')).tap()
    })

    describe('When Debit Card Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithCard')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await waitFor(element(by.id('Provider/Simplex')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        await expect(element(by.id('Icon/Simplex'))).toExist()
        await expect(element(by.id('Icon/Moonpay'))).toExist()
        await expect(element(by.id('Icon/Xanpool'))).toExist()
        await expect(element(by.id('Icon/Ramp'))).toExist()
        await expect(element(by.id('Icon/Transak'))).toExist()
        const imagePath = await device.takeScreenshot('CELO In Providers')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/CELO In Providers.png`)
      })
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('payWithBank')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('FiatExchangeInput')).replaceText('50')
        await element(by.id('FiatExchangeNextButton')).tap()
      })

      it('Then Should Display Providers', async () => {
        await waitFor(element(by.id('Provider/Simplex')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Provider/Simplex'))).toBeVisible()
        await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Provider/Ramp'))).toBeVisible()
        await expect(element(by.id('Provider/Transak'))).toBeVisible()
        await expect(element(by.id('Icon/Simplex'))).toExist()
        await expect(element(by.id('Icon/Moonpay'))).toExist()
        await expect(element(by.id('Icon/Xanpool'))).toExist()
        await expect(element(by.id('Icon/Ramp'))).toExist()
        await expect(element(by.id('Icon/Transak'))).toExist()
        const imagePath = await device.takeScreenshot('CELO In Providers')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/CELO In Providers.png`)
      })
    })

    describe('When Cryptocurrency Exchange Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Display Exchanges & Account Key', async () => {
        await waitFor(element(by.id('Binance')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Binance'))).toBeVisible()
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('Coinbase (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('Coinbase Pro (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('CoinList Pro'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('OKEx'))).toBeVisible()
        await expect(element(by.id('accountBox'))).toBeVisible()
        const imagePath = await device.takeScreenshot('CELO Exchanges')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/CELO Exchanges.png`)
      })
    })
  })
}
