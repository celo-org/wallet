import { enterPinUiIfNecessary, inputNumberKeypad, sleep } from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
const faker = require('faker')

const AMOUNT_TO_SEND = '0.1'
const AMOUNT_TO_REQUEST = '0.1'

export default Send = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
  })

  it('Send cUSD to address', async () => {
    let randomContent = faker.lorem.words()
    await waitFor(element(by.id('SendOrRequestBar/SendButton')))
      .toBeVisible()
      .withTimeout(30000)
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()

    // Continue send warning modal if present
    try {
      await waitFor(element(by.id('SendToAddressWarning/Continue')))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('SendToAddressWarning/Continue')).tap()
    } catch {}

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()

    await sleep(1000)

    // Write a comment.
    await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
    await element(by.id('commentInput/send')).tapReturnKey()

    if (device.getPlatform() === 'android') {
      // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
      // so we tap something else in the scrollview to hide the soft keyboard
      await element(by.id('HeaderText')).tap()
    }

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await element(by.id('ConfirmButton')).tap()
    await sleep(3000)

    // Confirm and input PIN if necessary.
    await enterPinUiIfNecessary()

    // Should not throw error
    await expect(element(by.id('errorBanner'))).not.toBeVisible()

    // Return to home.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    // TODO: See why these are taking so long in e2e tests to appear
    // Look for the latest transaction and assert
    // await waitFor(element(by.text(`${randomContent}`)))
    //   .toBeVisible()
    //   .withTimeout(60000)
  })

  // TODO(tomm): debug why error is thrown in e2e tests
  it.skip('Request cUSD from address', async () => {
    let randomContent = faker.lorem.words()
    await element(by.id('SendOrRequestBar/RequestButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_REQUEST)
    await element(by.id('Review')).tap()

    // Write a comment.
    await element(by.id('commentInput/request')).replaceText(`${randomContent}\n`)

    // Confirm and input PIN if necessary.
    await enterPinUiIfNecessary()

    // Should not throw error - enable firebase needed
    await expect(element(by.id('errorBanner'))).not.toBeVisible()

    // Return to home.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })
}
