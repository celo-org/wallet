import { enterPinUiIfNecessary, pixelDiff, waitForElementId, getDeviceModel } from '../utils/utils'
import { SAMPLE_BACKUP_KEY } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
import { reloadReactNative } from '../utils/retries'

export default ResetAccount = () => {
  beforeEach(async () => {
    await reloadReactNative()
    await dismissBanners()
  })

  it('Reset Account by doing the Account Key quiz', async () => {
    // This test has very high flakiness on Android. I did my best to fix it, but
    // locally it works every time but on CI it fails 50%+ of the time.
    // TODO: Keep investigating the source of flakiness of this test on Android.
    // if (device.getPlatform() === 'android') {
    //   return
    // }

    // Go to Settings
    await element(by.id('Hamburger')).tap()
    await element(by.id('Settings')).tap()

    // Scroll to bottom and start the reset process.
    // await waitForElementId('SettingsScrollView')
    // The sleep is here to avoid flakiness on the scroll. Without it the scroll to bottom intermittently fails
    // with a ~"Can't find view" error even though the SettingsScrollView is visible.
    // This probably doesn't reduce flakiness 100%, but in practice it reduces it significantly.
    // await sleep(2000)
    // await element(by.id('SettingsScrollView')).scrollTo('bottom')
    try {
      await waitFor(element(by.text('ResetAccount')))
        .toBeVisible()
        .whileElement(by.id('SettingsScrollView'))
        .scroll(350, 'down')
    } catch {}
    await element(by.id('ResetAccount')).tap()
    await element(by.id('RemoveAccountModal/PrimaryAction')).tap()

    await enterPinUiIfNecessary()

    // Go through the quiz.
    await element(by.id('backupKeySavedSwitch')).longPress()
    await element(by.id('backupKeyContinue')).tap()
    const mnemonic = SAMPLE_BACKUP_KEY.split(' ')
    await waitForElementId(`backupQuiz/${mnemonic[0]}`)
    for (const word of mnemonic) {
      await element(by.id(`backupQuiz/${word}`)).tap()
    }
    await element(by.id('QuizSubmit')).tap()

    // We can't actually confirm because the app will restart and Detox will hang.
    // TODO: Figure out a way to confirm and test that the app goes to the onboarding
    // screen on next open.
    // await element(by.id('ConfirmAccountRemovalModal/PrimaryAction')).tap()
    await waitForElementId('ConfirmAccountRemovalModal/PrimaryAction')
    await expect(element(by.id('ConfirmAccountRemovalModal/PrimaryAction'))).toBeVisible()
    const imagePath = await device.takeScreenshot('Reset Account')
    await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/Reset Account.png`)
  })
}
