import { sleep, enterPinUi, waitForElementId } from '../utils/utils'
import { EXAMPLE_NAME, VERIFICATION_PHONE_NUMBER } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { receiveSms } from '../utils/twilio'

export default NewAccountPhoneVerification = () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await dismissBanners()
  })

  // TODO: Make verification e2e tests work on Android
  it('Verify Phone Number', async () => {
    // Proceed Through Education Screens
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    // Create New Account
    await element(by.id('CreateAccountButton')).tap()

    // Accept Terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set and Verify Pin
    await enterPinUi()
    await enterPinUi()

    // Set phone number
    await expect(element(by.id('PhoneNumberField'))).toBeVisible()
    await element(by.id('PhoneNumberField')).replaceText(VERIFICATION_PHONE_NUMBER)
    await element(by.text('Start')).tap()
    await element(by.text('Start')).tap()

    // Write the verification codes.
    const codes = await receiveSms()
    for (let i = 0; i < 3; i++) {
      await element(by.id(`VerificationCode${i}`)).replaceText(codes[i])
    }

    // Skip contacts
    await waitForElementId('ImportContactsSkip')
    await element(by.id('ImportContactsSkip')).tap()

    // Arrived to the Home screen
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10000)

    // Check verify Verify CTA not served
    await element(by.id('CTA/ScrollContainer')).scroll(500, 'right')
    await expect(element(by.text('Confirm Now'))).not.toExist()

    // Check Phone Number is Present
    await element(by.id('Hamburger')).tap()
    console.log(VERIFICATION_PHONE_NUMBER)
    await expect(element(by.text(VERIFICATION_PHONE_NUMBER))).toBeVisible()
  })
}
