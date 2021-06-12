import { enterPinUiIfNecessary, inputNumberKeypad, sleep } from '../utils/utils'
import { dismissBanners } from '../utils/banners'
const faker = require('faker')

const PHONE_NUMBER = '+12057368924'
const LAST_ACCEOUNT_CHARACTERS = 'FD08'
const AMOUNT_TO_SEND = '0.1'

export default SecureSend = () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
  })

  it('Send cUSD to phone number with multiple mappings', async () => {
    let randomContent = faker.lorem.words()
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(PHONE_NUMBER)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()

    // hack: we shouldn't need this but the test fails without
    await sleep(3000)

    // Use the last digits of the account to confirm the sender.
    await element(by.id('confirmAccountButton')).tap()
    for (let index = 0; index < 4; index++) {
      const character = LAST_ACCEOUNT_CHARACTERS[index]
      await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
    }
    await element(by.id('ConfirmAccountButton')).tap()

    // Write a comment.
    await element(by.id('commentInput/send')).replaceText(`${randomContent}\n`)
    await element(by.id('commentInput/send')).tapReturnKey()

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)

    // Confirm and input PIN if necessary.
    await element(by.id('ConfirmButton')).tap()
    await enterPinUiIfNecessary()

    // Return to home screen.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()

    // Look for the latest transaction and assert
    await waitFor(element(by.text(`${randomContent}`)))
      .toBeVisible()
      .withTimeout(70000)
  })
}
