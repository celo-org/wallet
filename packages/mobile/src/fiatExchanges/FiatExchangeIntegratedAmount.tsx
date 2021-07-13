import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { CURRENCY_ENUM, CURRENCIES } from '@celo/utils/lib/currencies'
import { parseInputAmount } from '@celo/utils/lib/parsing'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import SwapArrows from 'src/icons/SwapArrows'
import {
  ALERT_BANNER_DURATION,
  DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { DOLLAR_ADD_FUNDS_MIN_AMOUNT } from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import i18n, { Namespaces } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { RecipientVerificationStatus } from 'src/identity/types'
import {
  convertDollarsToLocalAmount,
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  getLocalCurrencyExchangeRate,
  getLocalCurrencySymbol,
} from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientVerificationStatus, Recipient, RecipientKind } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { getFeeType, useDailyTransferLimitValidator } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

import { ExpandableWindow } from 'src/fiatExchanges/components/ExpandableWindow'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import SelectCurrency from 'src/fiatExchanges/SelectCurrency'
import SelectPaymentMethod from 'src/fiatExchanges/SelectPaymentMethod'
import ArrowFilled from 'src/icons/ArrowFilled'
import ArrowEmpty from 'src/icons/ArrowEmpty'
import Touchable from '@celo/react-components/components/Touchable'

export enum PaymentMethod {
  Card = 'Card',
  Bank = 'Bank',
  Exchange = 'Exchange',
  Address = 'Address',
  LocalProvider = 'LocalProvider',
  GiftCard = 'GiftCard',
}

enum OpenExtendedWindow {
  None,
  Currency,
  Method,
  Provider,
}

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeIntegratedAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

export const fiatExchangeIntegratedAmountOptions = () => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={FiatExchangeEvents.cico_add_funds_amount_back} />,
  }
}

const toDecimals = (number: BigNumber | null, decimals: number) =>
  number?.dp(decimals)?.toFixed() || '0'

function FiatExchangeIntegratedAmount({ navigation }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const [amount, setAmount] = useState('')
  const [isLocal, setIsLocal] = useState(true)
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)
  const [openExtendedWindow, setOpenExtendedWindow] = useState(OpenExtendedWindow.None)
  const [selectedCurrency, setSelectedCurrency] = useState<CURRENCY_ENUM>(CURRENCY_ENUM.DOLLAR)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.Card)

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const localAmount = isLocal
    ? amount
    : toDecimals(
        convertLocalAmountToDollars(new BigNumber(amount || 0), localCurrencyExchangeRate),
        2
      )

  const newSetOpenExtendedWindow = (newState: OpenExtendedWindow) =>
    React.useCallback(() => {
      setOpenExtendedWindow(newState)
    }, [setOpenExtendedWindow])

  const closeExtendedWindow = newSetOpenExtendedWindow(OpenExtendedWindow.None)
  const showCurrencyExtendedWindow = newSetOpenExtendedWindow(OpenExtendedWindow.Currency)
  const showMethodExtendedWindow = newSetOpenExtendedWindow(OpenExtendedWindow.Method)
  const showProviderExtendedWindow = newSetOpenExtendedWindow(OpenExtendedWindow.Provider)

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Touchable onPress={showCurrencyExtendedWindow}>
          <View style={styles.selectCurrencyContainer}>
            <Text style={styles.selectCurrency}>Add {CURRENCIES[selectedCurrency].code}</Text>
            <ArrowFilled />
          </View>
        </Touchable>
      ),
    })
  }, [selectedCurrency])

  const onSelectCurrency = React.useCallback((currency: CURRENCY_ENUM) => {
    setSelectedCurrency(currency)
    setOpenExtendedWindow(OpenExtendedWindow.None)
  }, [])
  const onSelectMethod = React.useCallback((method: PaymentMethod) => {
    setSelectedMethod(method)
    setOpenExtendedWindow(OpenExtendedWindow.None)
  }, [])

  const minAmountInLocalCurrency = convertDollarsToLocalAmount(
    DOLLAR_ADD_FUNDS_MIN_AMOUNT,
    localCurrencyExchangeRate
  )?.toFixed(0)

  const dispatch = useDispatch()

  const maxLength = React.useMemo(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return null
    }
    return decimalPos + NUMBER_INPUT_MAX_DECIMALS + 1
  }, [amount, decimalSeparator])

  console.log({ amount, localAmount })

  const onDigitPress = React.useCallback(
    (digit) => {
      if ((amount === '' && digit === 0) || (maxLength && amount.length + 1 > maxLength)) {
        return
      }
      setAmount(amount + digit.toString())
    },
    [amount, setAmount]
  )

  const onBackspacePress = React.useCallback(() => {
    setAmount(amount.substr(0, amount.length - 1))
  }, [amount, setAmount])

  const onSwapPress = React.useCallback(() => {
    const local = !isLocal
    const amountBn = new BigNumber(amount || 0)

    console.log({
      local,
      amount,
      swap: convertDollarsToLocalAmount(
        new BigNumber(amount || 0),
        localCurrencyExchangeRate
      )?.toFixed(4),
    })

    setIsLocal(local)
    if (local) {
      setAmount(localAmount)
    } else {
      setAmount(toDecimals(convertDollarsToLocalAmount(amountBn, localCurrencyExchangeRate), 4))
    }
  }, [amount, isLocal, setIsLocal])

  const onDecimalPress = React.useCallback(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos !== -1) {
      return
    }

    if (!amount) {
      setAmount('0' + decimalSeparator)
    } else {
      setAmount(amount + decimalSeparator)
    }
  }, [amount, setAmount])

  const getDollarAmount = (localAmount: BigNumber.Value) => {
    const dollarsAmount =
      convertLocalAmountToDollars(localAmount, localCurrencyExchangeRate) || new BigNumber('')

    return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  }

  const parsedLocalAmount = parseInputAmount(amount, decimalSeparator)
  const dollarAmount = getDollarAmount(parsedLocalAmount)

  const isAmountValid = dollarAmount.isGreaterThanOrEqualTo(DOLLAR_ADD_FUNDS_MIN_AMOUNT)
  const showMinError = !isAmountValid && parsedLocalAmount.isGreaterThan(0)

  return (
    <SafeAreaView style={styles.paddedContainer}>
      {openExtendedWindow === OpenExtendedWindow.Currency ? (
        <ExpandableWindow onClose={closeExtendedWindow} title="Select a Balance to Top Up">
          <SelectCurrency selectedCurrency={selectedCurrency} onSelect={onSelectCurrency} />
        </ExpandableWindow>
      ) : openExtendedWindow === OpenExtendedWindow.Method ? (
        <ExpandableWindow onClose={closeExtendedWindow} title="Select a Payment Method">
          <SelectPaymentMethod selectedMethod={selectedMethod} onSelect={onSelectMethod} />
        </ExpandableWindow>
      ) : openExtendedWindow === OpenExtendedWindow.Provider ? (
        <ExpandableWindow onClose={closeExtendedWindow} title="Select a Provider" />
      ) : null}
      <DisconnectBanner />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.showAmountContainer}>
          <View style={styles.amountLine}>
            <View style={styles.amountContainer}>
              <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.amount}>
                {isLocal && (localCurrencySymbol || localCurrencyCode)}
                {amount ? amount : '0'}
                {!isLocal && ' ' + CURRENCIES[selectedCurrency].code}
              </Text>
            </View>
            <Touchable onPress={onSwapPress} style={styles.reverseValue}>
              <SwapArrows />
            </Touchable>
          </View>
          {showMinError && (
            <Text style={styles.amountError}>
              The minimum order is {localCurrencySymbol}
              {minAmountInLocalCurrency}
            </Text>
          )}
        </View>
        <Touchable onPress={showMethodExtendedWindow} style={styles.buttonContainer}>
          <>
            <Text style={styles.buttonContent}>Pay with {selectedMethod}</Text>
            <ArrowEmpty />
          </>
        </Touchable>
        <NumberKeypad
          onDigitPress={onDigitPress}
          onBackspacePress={onBackspacePress}
          decimalSeparator={decimalSeparator}
          onDecimalPress={onDecimalPress}
        />
      </ScrollView>
      <Button
        style={styles.nextBtn}
        size={BtnSizes.FULL}
        text={t('global:review')}
        type={BtnTypes.SECONDARY}
        onPress={/*onReviewButtonPressed*/ () => null}
        disabled={!isAmountValid || reviewButtonPressed}
        testID="Review"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  paddedContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    flex: 1,
  },
  showAmountContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
    maxWidth: '75%',
    marginEnd: 'auto',
    marginStart: 'auto',
  },
  amountLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingLeft: 40,
  },
  amountError: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
  },
  amount: {
    ...fontStyles.regular,
    fontSize: 64,
    lineHeight: undefined,
  },
  reverseValue: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderColor: colors.gray2,
    borderWidth: 1,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  nextBtn: {
    paddingVertical: variables.contentPadding,
  },
  selectCurrencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectCurrency: {
    ...fontStyles.h3,
    paddingRight: 6,
  },
  buttonContainer: {
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.gray2,
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: 20,
  },
  buttonContent: {
    color: colors.greenBrand,
    paddingRight: 12,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
})

export default FiatExchangeIntegratedAmount
