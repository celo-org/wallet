import { dismissBanners } from '../utils/banners'
import { pixelDiff, sleep, enterPinUiIfNecessary, getDeviceModel } from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { reloadReactNative } from '../utils/retries'

export default offRamps = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await dismissBanners()
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('cashOut')).tap()
  })

  describe('cUSD', () => {
    beforeEach(async () => {
      await element(by.id('radio/cUSD')).tap()
    })

    describe('When Bank Account Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBank')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Should Be Able To Navigate To Providers', async () => {
        await element(by.id('FiatExchangeInput')).replaceText('2')
        await element(by.id('FiatExchangeNextButton')).tap()
        await waitFor(element(by.id('Provider/Xanpool')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
        await expect(element(by.id('Icon/Xanpool'))).toExist()
        const imagePath = await device.takeScreenshot('cUSD Out Providers')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/cUSD Out Providers.png`)
      })
    })

    describe.skip('When Gift Cards and Mobile Top Up Selected', () => {
      beforeEach(async () => {
        await element(by.id('receiveWithBidali')).tap()
        await element(by.text('Next')).tap()
      })

      it('Then Bidali Should Display', async () => {
        await expect(element(by.text('Bidali'))).toBeVisible()
        // TODO: Include Check of Screenshot in Nightly Tests
        // await sleep(15000)
        // const imagePath = await device.takeScreenshot('Bidali')
        // await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/Bidali.png`)
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
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

    describe('When Address Selected', () => {
      const randomAmount = `${Math.random().toFixed(3)}`

      beforeEach(async () => {
        await element(by.id('receiveOnAddress')).tap()
        await element(by.text('Next')).tap()
        await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
        await element(by.id('CeloAmount')).replaceText(randomAmount)
        //TODO: Investigate why sleep is needed
        await sleep(1000)
        await element(by.id('WithdrawReviewButton')).tap()
      })

      it('Then Should Be Able To Send To Address', async () => {
        // console.log('randomAmount: ', `-${randomAmount} CELO`)
        await element(by.id('ConfirmWithdrawButton')).tap()
        await enterPinUiIfNecessary()
        await expect(element(by.text(`-${randomAmount} CELO`))).toBeVisible()
      })
    })

    describe('When Cryptocurrency Exchanges Selected', () => {
      beforeEach(async () => {
        await element(by.id('withExchange')).tap()
        await element(by.id('GoToProviderButton')).tap()
      })

      it('Then Should Display Exchanges & Account Key', async () => {
        await waitFor(element(by.id('Binance')))
          .toBeVisible()
          .withTimeout(20000)
        await expect(element(by.id('Binance'))).toBeVisible()
        await expect(element(by.id('Bittrex'))).toBeVisible()
        await expect(element(by.id('Coinbase (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('Coinbase Pro (CELO as CGLD)'))).toBeVisible()
        await expect(element(by.id('OKCoin'))).toBeVisible()
        await expect(element(by.id('OKEx'))).toBeVisible()
        await expect(element(by.id('accountBox'))).toBeVisible()
        const imagePath = await device.takeScreenshot('CELO Exchanges')
        await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/CELO Exchanges.png`)
      })
    })
  })
}
