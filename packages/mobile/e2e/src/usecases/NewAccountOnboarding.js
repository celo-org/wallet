import { enterPinUi, sleep } from '../utils/utils'
import { EXAMPLE_NAME } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { launchApp } from '../utils/retries'

export default NewAccountOnboarding = () => {
  beforeAll(async () => {
    await device.terminateApp()
    await sleep(5000)
    await launchApp({
      delete: true,
      permissions: { notifications: 'YES', contacts: 'YES' },
    })
    await device.setURLBlacklist(['.*blockchain-api-dot-celo-mobile-alfajores.appspot.com.*'])
    await sleep(5000)
    await dismissBanners()
  })

  it('Create a new account', async () => {
    // Onboarding education has 3 steps
    for (let i = 0; i < 3; i++) {
      await element(by.id('Education/progressButton')).tap()
    }

    await element(by.id('CreateAccountButton')).tap()

    // Accept Terms
    await element(by.id('scrollView')).scrollTo('bottom')
    await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
    await element(by.id('AcceptTermsButton')).tap()

    // Set name and number
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await element(by.id('NameAndPictureContinueButton')).tap()

    // Set & Verify pin
    await enterPinUi()
    await enterPinUi()

    // Dismiss banners if present
    await dismissBanners()

    // Skip Phone Number verification
    await element(by.id('VerificationEducationSkipHeader')).tap()
    await element(by.id('VerificationSkipDialog/PrimaryAction')).tap()

    // Arrived to Home screen
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
  })

  // Ideally this wouldn't be dependent on the previous test
  // Skip setup on android for now
  if (device.getPlatform() === 'ios') {
    it('Setup Account Key', async () => {
      await element(by.id('Hamburger')).tap()
      await element(by.id('DrawerItem/Account Key')).tap()

      await enterPinUi()

      await element(by.id('SetUpAccountKey')).tap()

      // Go through education
      for (let i = 0; i < 4; i++) {
        await element(by.id('Education/progressButton')).tap()
      }

      await expect(element(by.id('AccountKeyWords'))).toBeVisible()

      const attributes = await element(by.id('AccountKeyWords')).getAttributes()
      const accountKey = attributes.text

      await element(by.id('backupKeySavedSwitch')).longPress()
      await element(by.id('backupKeyContinue')).tap()
      for (const word of accountKey.split(' ')) {
        await element(by.id(`backupQuiz/${word}`)).tap()
      }
      await element(by.id('QuizSubmit')).tap()
    })
  }
}
