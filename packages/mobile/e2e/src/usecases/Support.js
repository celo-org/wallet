import { dismissBanners } from '../utils/banners'
import { pixelDiff, setDemoMode, sleep, webViewBack } from '../utils/utils'

export default Support = () => {
  beforeAll(async () => {
    await setDemoMode()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await dismissBanners()
  })

  if (device.getPlatform() === 'ios') {
    it("Display 'Contact' on Shake", async () => {
      await device.shake()
      await waitFor(element(by.id('ContactTitle')))
        .toBeVisible()
        .withTimeout(5000)
      await waitFor(element(by.id('MessageEntry')))
        .toBeVisible()
        .withTimeout(5000)
      await expect(element(by.id('SwitchLogs'))).toHaveToggleValue(true)
      await expect(element(by.id('Legal'))).toHaveText(
        'By submitting, I agree to share the above information and any attached application log data with Valora Support.'
      )
      const imagePath = await device.takeScreenshot('Support - ios')
      pixelDiff(
        imagePath,
        device.getPlatform() === 'ios'
          ? './e2e/assets/Support - ios.png'
          : './e2e/assets/Support - android.png'
      )
    })
  }

  it('Send message to support', async () => {
    await element(by.id('Hamburger')).tap()
    try {
      await waitFor(element(by.text('Help')))
        .toBeVisible()
        .whileElement(by.id('SettingsScrollView'))
        .scroll(350, 'down')
    } catch {}
    await waitFor(element(by.id('Help')))
      .toExist()
      .withTimeout(5000)
    await element(by.id('Help')).tap()
    await element(by.id('SupportContactLink')).tap()
    await waitFor(element(by.id('MessageEntry')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('MessageEntry')).replaceText('This is a test from cLabs')
    await expect(element(by.id('MessageEntry'))).toHaveText('This is a test from cLabs')
    // TODO: Send Request after briefing support if appropriate
  })
}
