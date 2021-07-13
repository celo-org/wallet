import colors from '@celo/react-components/styles/colors'
import { RouteProp } from '@react-navigation/core'
import { createStackNavigator, StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import GoldEducation from 'src/account/GoldEducation'
import Licenses from 'src/account/Licenses'
import Profile from 'src/account/Profile'
import RaiseLimitScreen from 'src/account/RaiseLimitScreen'
import { PincodeType } from 'src/account/reducer'
import StoreWipeRecoveryScreen from 'src/account/StoreWipeRecoveryScreen'
import SupportContact from 'src/account/SupportContact'
import { CeloExchangeEvents } from 'src/analytics/Events'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import { currentLanguageSelector } from 'src/app/reducers'
import UpgradeScreen from 'src/app/UpgradeScreen'
import WebViewScreen, { webViewScreenNavOptions } from 'src/app/WebViewScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupForceScreen from 'src/backup/BackupForceScreen'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import CancelButton from 'src/components/CancelButton'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import DappKitTxDataScreen from 'src/dappkit/DappKitTxDataScreen'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import WithdrawCeloQrScannerScreen from 'src/exchange/WithdrawCeloQrScannerScreen'
import WithdrawCeloReviewScreen from 'src/exchange/WithdrawCeloReviewScreen'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import CashInSuccess from 'src/fiatExchanges/CashInSuccess'
import ExternalExchanges, {
  externalExchangesScreenOptions,
} from 'src/fiatExchanges/ExternalExchanges'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import FiatExchangeIntegratedAmount, {
  fiatExchangeIntegratedAmountOptions,
} from 'src/fiatExchanges/FiatExchangeIntegratedAmount'
import FiatExchangeOptions, {
  fiatExchangesOptionsScreenOptions,
} from 'src/fiatExchanges/FiatExchangeOptions'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import SimplexScreen from 'src/fiatExchanges/SimplexScreen'
import Spend, { spendScreenOptions } from 'src/fiatExchanges/Spend'
import i18n from 'src/i18n'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import ImportWallet from 'src/import/ImportWallet'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import {
  emptyHeader,
  HeaderTitleWithBalance,
  HeaderTitleWithSubtitle,
  headerWithBackButton,
  headerWithCancelButton,
  noHeader,
  noHeaderGestureDisabled,
  nuxNavigationOptions,
} from 'src/navigator/Headers'
import { navigateBack, navigateToExchangeHome } from 'src/navigator/NavigationService'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import ImportContactsScreen from 'src/onboarding/contacts/ImportContactsScreen'
import OnboardingEducationScreen from 'src/onboarding/education/OnboardingEducationScreen'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import RegulatoryTerms from 'src/onboarding/registration/RegulatoryTerms'
import SelectCountry from 'src/onboarding/registration/SelectCountry'
import OnboardingSuccessScreen from 'src/onboarding/success/OnboardingSuccessScreen'
import Welcome from 'src/onboarding/welcome/Welcome'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestConfirmation, {
  paymentConfirmationScreenNavOptions,
} from 'src/paymentRequest/PaymentRequestConfirmation'
import PaymentRequestUnavailable, {
  paymentRequestUnavailableScreenNavOptions,
} from 'src/paymentRequest/PaymentRequestUnavailable'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation, { sendConfirmationScreenNavOptions } from 'src/send/SendConfirmation'
import ValidateRecipientAccount, {
  validateRecipientAccountScreenNavOptions,
} from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro, {
  validateRecipientIntroScreenNavOptions,
} from 'src/send/ValidateRecipientIntro'
import SetClock from 'src/set-clock/SetClock'
import TransactionReview from 'src/transactions/TransactionReview'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { ExtractProps } from 'src/utils/typescript'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import WalletConnectActionRequestScreen from 'src/walletConnect/screens/ActionRequest'
import WalletConnectSessionRequestScreen from 'src/walletConnect/screens/SessionRequest'
import WalletConnectSessionsScreen from 'src/walletConnect/screens/Sessions'

const TAG = 'Navigator'

const Stack = createStackNavigator<StackParamList>()
const RootStack = createStackNavigator<StackParamList>()

type NavigationOptions = StackScreenProps<StackParamList, keyof StackParamList>

export const modalScreenOptions = ({ route, navigation }: NavigationOptions) =>
  Platform.select({
    // iOS 13 modal presentation
    ios: {
      gestureEnabled: true,
      cardOverlayEnabled: true,
      headerStatusBarHeight: 0,
      ...TransitionPresets.ModalPresentationIOS,
    },
  })

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} options={noHeader} />
      <Navigator.Screen
        name={Screens.UpgradeScreen}
        component={UpgradeScreen}
        options={UpgradeScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitAccountAuth}
        component={DappKitAccountScreen}
        options={DappKitAccountScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitSignTxScreen}
        component={DappKitSignTxScreen}
        options={DappKitSignTxScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitTxDataScreen}
        component={DappKitTxDataScreen}
        options={DappKitTxDataScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.WalletConnectSessionRequest}
        component={WalletConnectSessionRequestScreen}
        options={WalletConnectSessionRequestScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.WalletConnectActionRequest}
        component={WalletConnectActionRequestScreen}
        options={WalletConnectActionRequestScreen.navigationOptions}
      />
      <Navigator.Screen name={Screens.Debug} component={Debug} options={Debug.navigationOptions} />
      <Navigator.Screen
        name={Screens.PhoneNumberLookupQuota}
        component={PhoneNumberLookupQuotaScreen}
        options={noHeaderGestureDisabled}
      />
      <Navigator.Screen
        name={Screens.WebViewScreen}
        component={WebViewScreen}
        options={webViewScreenNavOptions}
      />
    </>
  )
}

const verificationScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.VerificationEducationScreen}
        component={VerificationEducationScreen}
        options={VerificationEducationScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationLoadingScreen}
        component={VerificationLoadingScreen}
        options={VerificationLoadingScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationInputScreen}
        component={VerificationInputScreen}
        options={VerificationInputScreen.navigationOptions}
      />
    </>
  )
}

const pincodeSetScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.PincodeSet>
}) => {
  const changePin = route.params?.changePin
  const title = changePin
    ? i18n.t('onboarding:pincodeSet.changePIN')
    : i18n.t('onboarding:pincodeSet.create')

  return {
    ...nuxNavigationOptions,
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={title}
        subTitle={changePin ? ' ' : i18n.t('onboarding:step', { step: '2' })}
      />
    ),
  }
}

const nuxScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.OnboardingEducationScreen}
      component={OnboardingEducationScreen}
      options={OnboardingEducationScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.Welcome}
      component={Welcome}
      options={Welcome.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.NameAndPicture}
      component={NameAndPicture}
      options={NameAndPicture.navOptions}
    />
    <Navigator.Screen
      name={Screens.PincodeSet}
      component={PincodeSet}
      options={pincodeSetScreenOptions}
    />
    <Navigator.Screen
      name={Screens.ImportWallet}
      component={ImportWallet}
      options={ImportWallet.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportContacts}
      component={ImportContactsScreen}
      options={ImportContactsScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.OnboardingSuccessScreen}
      component={OnboardingSuccessScreen}
      options={OnboardingSuccessScreen.navigationOptions}
    />
  </>
)

const sendScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.Send} component={Send} options={Send.navigationOptions} />
    <Navigator.Screen
      name={Screens.SendAmount}
      component={SendAmount}
      options={SendAmount.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmation}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientIntro}
      component={ValidateRecipientIntro}
      options={validateRecipientIntroScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientAccount}
      component={ValidateRecipientAccount}
      options={validateRecipientAccountScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestUnavailable}
      component={PaymentRequestUnavailable}
      options={paymentRequestUnavailableScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestConfirmation}
      component={PaymentRequestConfirmation}
      options={paymentConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.IncomingPaymentRequestListScreen}
      component={IncomingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.OutgoingPaymentRequestListScreen}
      component={OutgoingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.EscrowedPaymentListScreen}
      component={EscrowedPaymentListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.ReclaimPaymentConfirmationScreen}
      component={ReclaimPaymentConfirmationScreen}
      options={headerWithBackButton}
    />
  </>
)

const exchangeReviewScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeReview>
}) => {
  const { makerToken } = route.params
  const isCeloPurchase = makerToken !== Currency.Celo
  const title = isCeloPurchase ? i18n.t('exchangeFlow9:buyGold') : i18n.t('exchangeFlow9:sellGold')
  const cancelEventName = isCeloPurchase
    ? CeloExchangeEvents.celo_buy_cancel
    : CeloExchangeEvents.celo_sell_cancel
  const editEventName = isCeloPurchase
    ? CeloExchangeEvents.celo_buy_edit
    : CeloExchangeEvents.celo_sell_edit
  return {
    ...headerWithCancelButton,
    headerLeft: () => (
      <CancelButton onCancel={navigateToExchangeHome} eventName={cancelEventName} />
    ),
    headerRight: () => (
      <TopBarTextButton
        title={i18n.t('global:edit')}
        testID="EditButton"
        onPress={navigateBack}
        titleStyle={{ color: colors.goldDark }}
        eventName={editEventName}
      />
    ),
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}
const exchangeScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ExchangeTradeScreen}
      component={ExchangeTradeScreen}
      options={noHeader}
    />
    <Navigator.Screen
      name={Screens.ExchangeReview}
      component={ExchangeReview}
      options={exchangeReviewScreenOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloScreen}
      component={WithdrawCeloScreen}
      options={WithdrawCeloScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloQrScannerScreen}
      component={WithdrawCeloQrScannerScreen}
      options={WithdrawCeloQrScannerScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloReviewScreen}
      component={WithdrawCeloReviewScreen}
      options={WithdrawCeloReviewScreen.navigationOptions}
    />
  </>
)

const consumerIncentivesScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ConsumerIncentivesHomeScreen}
      component={ConsumerIncentivesHomeScreen}
      options={ConsumerIncentivesHomeScreen.navOptions}
    />
  </>
)

const backupScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.BackupForceScreen}
      component={BackupForceScreen}
      options={BackupForceScreen.navOptions}
    />
    <Navigator.Screen
      name={Screens.BackupPhrase}
      component={BackupPhrase}
      options={navOptionsForBackupPhrase}
    />
    <Navigator.Screen
      name={Screens.BackupQuiz}
      component={BackupQuiz}
      options={navOptionsForQuiz}
    />
    <Navigator.Screen name={Screens.BackupComplete} component={BackupComplete} options={noHeader} />
    <Navigator.Screen
      name={Screens.StoreWipeRecoveryScreen}
      component={StoreWipeRecoveryScreen}
      options={StoreWipeRecoveryScreen.navOptions}
    />
  </>
)

const settingsScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      options={Profile.navigationOptions}
      name={Screens.Profile}
      component={Profile}
    />
    <Navigator.Screen
      name={Screens.Language}
      component={Language}
      options={Language.navigationOptions(false)}
    />
    <Navigator.Screen
      name={Screens.SelectLocalCurrency}
      component={SelectLocalCurrency}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.WalletConnectSessions}
      component={WalletConnectSessionsScreen}
      options={WalletConnectSessionsScreen.navigationOptions}
    />
    <Navigator.Screen
      options={Licenses.navigationOptions}
      name={Screens.Licenses}
      component={Licenses}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.SupportContact}
      component={SupportContact}
    />
    <Navigator.Screen
      options={RaiseLimitScreen.navOptions}
      name={Screens.RaiseLimitScreen}
      component={RaiseLimitScreen}
    />
    <Navigator.Screen
      options={externalExchangesScreenOptions}
      name={Screens.ExternalExchanges}
      component={ExternalExchanges}
    />
    <Navigator.Screen options={spendScreenOptions} name={Screens.Spend} component={Spend} />
    <Navigator.Screen
      options={FiatExchangeAmount.navOptions}
      name={Screens.FiatExchangeAmount}
      component={FiatExchangeAmount}
    />
    <Navigator.Screen
      options={fiatExchangeIntegratedAmountOptions}
      name={Screens.FiatExchangeIntegratedAmount}
      component={FiatExchangeIntegratedAmount}
    />
    <Navigator.Screen
      options={fiatExchangesOptionsScreenOptions}
      name={Screens.FiatExchangeOptions}
      component={FiatExchangeOptions}
    />
    <Navigator.Screen
      options={CashInSuccess.navigationOptions}
      name={Screens.CashInSuccess}
      component={CashInSuccess}
    />
    <Navigator.Screen
      options={SimplexScreen.navigationOptions}
      name={Screens.Simplex}
      component={SimplexScreen}
    />
    <Navigator.Screen
      options={ProviderOptionsScreen.navigationOptions}
      name={Screens.ProviderOptionsScreen}
      component={ProviderOptionsScreen}
    />
    <Navigator.Screen
      options={BidaliScreen.navigationOptions}
      name={Screens.BidaliScreen}
      component={BidaliScreen}
    />
  </>
)

const generalScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.SetClock}
      component={SetClock}
      options={noHeaderGestureDisabled}
    />
    <Navigator.Screen
      name={Screens.TransactionReview}
      component={TransactionReview}
      options={TransactionReview.navOptions}
    />
  </>
)

const mapStateToProps = (state: RootState) => {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    language: currentLanguageSelector(state),
    name: state.account.name,
    acceptedTerms: state.account.acceptedTerms,
    pincodeType: state.account.pincodeType,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
    askedContactsPermission: state.identity.askedContactsPermission,
  }
}

type InitialRouteName = ExtractProps<typeof Stack.Navigator>['initialRouteName']

export function MainStackScreen() {
  const [initialRouteName, setInitialRoute] = React.useState<InitialRouteName>(undefined)

  React.useEffect(() => {
    const {
      choseToRestoreAccount,
      language,
      name,
      acceptedTerms,
      pincodeType,
      account,
      hasSeenVerificationNux,
    } = mapStateToProps(store.getState())

    let initialRoute: InitialRouteName

    if (!language) {
      initialRoute = Screens.Language
    } else if (!name || !acceptedTerms || pincodeType === PincodeType.Unset) {
      // User didn't go far enough in onboarding, start again from education
      initialRoute = Screens.OnboardingEducationScreen
    } else if (!account) {
      initialRoute = choseToRestoreAccount
        ? Screens.ImportWallet
        : Screens.OnboardingEducationScreen
    } else if (!hasSeenVerificationNux) {
      initialRoute = Screens.VerificationEducationScreen
    } else {
      initialRoute = Screens.DrawerNavigator
    }

    setInitialRoute(initialRoute)
    Logger.info(`${TAG}@MainStackScreen`, `Initial route: ${initialRoute}`)

    // Wait for next frame to avoid slight gap when hiding the splash
    requestAnimationFrame(() => SplashScreen.hide())
  }, [])

  if (!initialRouteName) {
    return <AppLoading />
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={emptyHeader}>
      <Stack.Screen name={Screens.DrawerNavigator} component={DrawerNavigator} options={noHeader} />
      {commonScreens(Stack)}
      {sendScreens(Stack)}
      {nuxScreens(Stack)}
      {verificationScreens(Stack)}
      {exchangeScreens(Stack)}
      {backupScreens(Stack)}
      {consumerIncentivesScreens(Stack)}
      {settingsScreens(Stack)}
      {generalScreens(Stack)}
    </Stack.Navigator>
  )
}

const modalAnimatedScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.PincodeEnter}
      component={PincodeEnter}
      options={PincodeEnter.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.QRNavigator}
      component={QRNavigator}
      options={QRNavigator.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.RegulatoryTerms}
      component={RegulatoryTerms}
      options={RegulatoryTerms.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.GoldEducation}
      component={GoldEducation}
      options={GoldEducation.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.AccountKeyEducation}
      component={AccountKeyEducation}
      options={AccountKeyEducation.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.LanguageModal}
      component={Language}
      options={Language.navigationOptions(true)}
    />
    <Navigator.Screen
      name={Screens.SelectCountry}
      component={SelectCountry}
      options={SelectCountry.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationModal}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions}
    />
  </>
)

const mainScreenNavOptions = (navOptions: NavigationOptions) => ({
  ...modalScreenOptions(navOptions),
  headerShown: false,
})

function RootStackScreen() {
  return (
    <RootStack.Navigator mode="modal">
      <RootStack.Screen
        name={Screens.Main}
        component={MainStackScreen}
        options={mainScreenNavOptions}
      />
      {modalAnimatedScreens(RootStack)}
    </RootStack.Navigator>
  )
}

export default RootStackScreen
