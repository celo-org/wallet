import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga/effects'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { appLock, openDeepLink, openUrl, setAppState } from 'src/app/actions'
import { handleDeepLink, handleOpenUrl, handleSetAppState } from 'src/app/saga'
import { getAppLocked, getLastTimeBackgrounded, getRequirePinOnAppOpen } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handlePaymentDeeplink } from 'src/send/utils'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { handleWalletConnectDeepLink } from 'src/walletConnect/walletConnect'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/dappkit/dappkit')

const MockedAnalytics = ValoraAnalytics as any

describe('App saga', () => {
  beforeEach(() => {
    MockedAnalytics.track = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Handles Dappkit deep link', async () => {
    const deepLink = 'celo://wallet/dappkit?abcdsa'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(handleDappkitDeepLink).toHaveBeenCalledWith(deepLink)
  })

  it('Handles verification deep link', async () => {
    await expectSaga(handleDeepLink, openDeepLink('celo://wallet/v/12345'))
      .put(receiveAttestationMessage('12345', CodeInputType.DEEP_LINK))
      .run()
  })

  it('Handles payment deep link', async () => {
    const data = {
      address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
      displayName: 'Super 8',
      currencyCode: 'PHP',
      amount: '500',
      comment: '92a53156-c0f2-11ea-b3de-0242ac13000',
    }

    const params = new URLSearchParams(data)
    const deepLink = `celo://wallet/pay?${params.toString()}`

    await expectSaga(handleDeepLink, openDeepLink(deepLink))
      .provide([[matchers.call.fn(handlePaymentDeeplink), deepLink]])
      .run()
  })

  it('Handles cash in deep link', async () => {
    const deepLink = 'celo://wallet/cashIn'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeOptions, { isCashIn: true })
  })

  it('Handles Bidali deep link', async () => {
    const deepLink = 'celo://wallet/bidali'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, { currency: Currency.Dollar })
  })

  it('Handles openScreen deep link with safe origin', async () => {
    const deepLink = `celo://wallet/openScreen?screen=${Screens.FiatExchangeOptions}&isCashIn=true`
    await expectSaga(handleDeepLink, openDeepLink(deepLink, true)).run()
    expect(navigate).toHaveBeenCalledWith(
      Screens.FiatExchangeOptions,
      expect.objectContaining({ isCashIn: true })
    )
  })

  it('Handles openScreen deep link without safe origin', async () => {
    const deepLink = `celo://wallet/openScreen?screen=${Screens.FiatExchangeOptions}&isCashIn=true`
    await expectSaga(handleDeepLink, openDeepLink(deepLink, false)).run()
    expect(navigate).not.toHaveBeenCalled()
  })

  describe('WalletConnect deeplinks', () => {
    const connectionString = encodeURIComponent(
      'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@2?controller=false&publicKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39&relay={"protocol":"waku"}'
    )
    const connectionLinks = [
      {
        name: 'Android',
        link: connectionString,
      },
      {
        name: 'iOS deeplink',
        link: `celo://wallet/wc?uri=${connectionString}`,
      },
      {
        name: 'iOS universal link',
        link: `https://valoraapp.com/wc?uri=${connectionString}`,
      },
    ]

    for (const { name, link } of connectionLinks) {
      it(`handles ${name} connection links correctly`, async () => {
        await expectSaga(handleDeepLink, openDeepLink(link))
          .call(handleWalletConnectDeepLink, link)
          .call(initialiseWalletConnect, decodeURIComponent(connectionString))
          .run()
      })
    }

    // action requests are incomplete URLs, wallets should handle presenting
    // the user with the request.
    const actionString = 'wc:1234'
    const actionLinks = [
      { name: 'Android', link: actionString },
      { name: 'iOS deeplink', link: `celo://wallet/wc?uri=${actionString}` },
      { name: 'iOS universal link', link: `https://valoraapp.com/wc?uri=${actionString}` },
    ]
    for (const { name, link } of actionLinks) {
      it(`handles ${name} action links correctly`, async () => {
        await expectSaga(handleDeepLink, openDeepLink(link))
          .call(handleWalletConnectDeepLink, link)
          .not.call(initialiseWalletConnect)
          .run()
      })
    }
  })

  describe(handleOpenUrl, () => {
    const httpLink = 'http://example.com'
    const httpsLink = 'https://example.com'
    const celoLink = 'celo://something'
    const otherDeepLink = 'other://deeplink'

    describe('when openExternal is `false` or not specified', () => {
      it('opens http links using WebViewScreen', async () => {
        await expectSaga(handleOpenUrl, openUrl(httpLink)).not.call.fn(handleDeepLink).run()
        expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: httpLink })
        expect(navigateToURI).not.toHaveBeenCalled()
      })

      it('opens http or https links using WebViewScreen', async () => {
        await expectSaga(handleOpenUrl, openUrl(httpsLink)).not.call.fn(handleDeepLink).run()
        expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: httpsLink })
        expect(navigateToURI).not.toHaveBeenCalled()
      })

      it('opens celo links directly', async () => {
        await expectSaga(handleOpenUrl, openUrl(celoLink))
          .call(handleDeepLink, openDeepLink(celoLink))
          .run()
        expect(navigate).not.toHaveBeenCalled()
        expect(navigateToURI).not.toHaveBeenCalled()
      })

      // openExternal is more of a preference, that's why we still open other links externally
      // because we wouldn't know what to do with them anyway
      it('opens other links externally', async () => {
        await expectSaga(handleOpenUrl, openUrl(otherDeepLink)).not.call.fn(handleDeepLink).run()
        expect(navigate).not.toHaveBeenCalled()
        expect(navigateToURI).toHaveBeenCalledWith(otherDeepLink)
      })
    })

    describe('when openExternal is `true`', () => {
      it('opens http links externally', async () => {
        await expectSaga(handleOpenUrl, openUrl(httpLink, true)).not.call.fn(handleDeepLink).run()
        expect(navigate).not.toHaveBeenCalled()
        expect(navigateToURI).toHaveBeenCalledWith(httpLink)
      })

      it('opens https links externally', async () => {
        await expectSaga(handleOpenUrl, openUrl(httpsLink, true)).not.call.fn(handleDeepLink).run()
        expect(navigate).not.toHaveBeenCalled()
        expect(navigateToURI).toHaveBeenCalledWith(httpsLink)
      })

      // openExternal is more of a preference, that's why we still handle these directly
      it('opens celo links directly', async () => {
        await expectSaga(handleOpenUrl, openUrl(celoLink, true))
          .call(handleDeepLink, openDeepLink(celoLink))
          .run()
        expect(navigate).not.toHaveBeenCalled()
        expect(navigateToURI).not.toHaveBeenCalled()
      })

      it('opens other links externally', async () => {
        await expectSaga(handleOpenUrl, openUrl(otherDeepLink, true))
          .not.call.fn(handleDeepLink)
          .run()
        expect(navigate).not.toHaveBeenCalled()
        expect(navigateToURI).toHaveBeenCalledWith(otherDeepLink)
      })
    })
  })

  it('Handles set app state', async () => {
    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .put(appLock())
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), true],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), Date.now()],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), false],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()
  })
})
