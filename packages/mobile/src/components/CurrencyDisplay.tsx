import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ColorValue, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import i18n from 'src/i18n'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import { useLocalCurrencyToShow } from 'src/localCurrency/hooks'
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import {
  getCentAwareMoneyDisplay,
  getExchangeRateDisplayValue,
  getFeeDisplayValue,
  getMoneyDisplayValue,
  getNetworkFeeDisplayValue,
} from 'src/utils/formatting'

export enum DisplayType {
  Default,
  Big, // symbol displayed as superscript
}

export enum FormatType {
  Default,
  CentAware,
  Fee,
  NetworkFee,
  NetworkFeePrecise,
  ExchangeRate,
}

interface Props {
  type: DisplayType
  amount: MoneyAmount
  size: number // only used for DisplayType.Big
  useColors: boolean
  hideSign: boolean
  hideSymbol: boolean
  hideCode: boolean
  showLocalAmount?: boolean
  showExplicitPositiveSign: boolean // shows '+' for a positive amount when true (default is false)
  formatType: FormatType
  hideFullCurrencyName: boolean
  style?: StyleProp<TextStyle>
  currencyInfo?: CurrencyInfo
  testID?: string
}

const BIG_SIGN_RATIO = 34 / 48
const BIG_SYMBOL_RATIO = 24 / 48
const BIG_CODE_RATIO = 16 / 48
const BIG_LINE_HEIGHT_RATIO = 64 / 48

function getBigSymbolStyle(fontSize: number, color: ColorValue | undefined): StyleProp<TextStyle> {
  const size = Math.floor(fontSize * BIG_SYMBOL_RATIO)
  return {
    paddingVertical: 4,
    fontSize: size,
    color,
  }
}

function getLocalAmount(
  amount: MoneyAmount,
  localCurrencyCode: LocalCurrencyCode,
  exchangeRate: BigNumber.Value | null | undefined
) {
  if (amount.localAmount) {
    return amount.localAmount
  }

  const localValue = convertCurrencyToLocalAmount(amount.value, exchangeRate)
  if (!localValue) {
    return null
  }

  return {
    value: localValue,
    currencyCode: localCurrencyCode as string,
  }
}

type FormatFunction = (amount: BigNumber.Value, currency?: Currency) => string

function getFormatFunction(formatType: FormatType): FormatFunction {
  switch (formatType) {
    case FormatType.Default:
      return getMoneyDisplayValue
    case FormatType.CentAware:
      return (amount: BigNumber.Value, _currency?: Currency) => getCentAwareMoneyDisplay(amount)
    case FormatType.Fee:
      return (amount: BigNumber.Value, _currency?: Currency) => getFeeDisplayValue(amount)
    case FormatType.NetworkFee:
      return (amount: BigNumber.Value, _currency?: Currency) => getNetworkFeeDisplayValue(amount)
    case FormatType.NetworkFeePrecise:
      return (amount: BigNumber.Value, _currency?: Currency) =>
        getNetworkFeeDisplayValue(amount, true)
    case FormatType.ExchangeRate:
      return (amount: BigNumber.Value, _currency?: Currency) => getExchangeRateDisplayValue(amount)
  }
}

export function getFullCurrencyName(currency: Currency | null) {
  switch (currency) {
    case Currency.Dollar:
      return i18n.t('global:celoDollars')
    case Currency.Euro:
      return i18n.t('global:celoEuros')
    case Currency.Celo:
      return i18n.t('global:celoGold')
    default:
      return null
  }
}

export default function CurrencyDisplay({
  type,
  size,
  useColors,
  hideSign,
  hideSymbol,
  hideCode,
  showLocalAmount,
  showExplicitPositiveSign,
  amount,
  formatType,
  hideFullCurrencyName,
  style,
  currencyInfo,
  testID,
}: Props) {
  const { localCurrencyCode, localCurrencyExchangeRate, amountCurrency } = useLocalCurrencyToShow(
    amount,
    currencyInfo
  )

  // Show local amount only if explicitly set to true when currency is CELO
  const shouldShowLocalAmount = showLocalAmount ?? amountCurrency !== Currency.Celo
  const displayAmount = shouldShowLocalAmount
    ? getLocalAmount(amount, localCurrencyCode, localCurrencyExchangeRate)
    : amount
  const displayCurrency = displayAmount
    ? displayAmount.currencyCode === Currency.Celo
      ? Currency.Celo
      : Currency.Dollar
    : null
  const currencySymbol = displayAmount
    ? shouldShowLocalAmount
      ? LocalCurrencySymbol[displayAmount.currencyCode as LocalCurrencyCode]
      : CURRENCIES[amountCurrency].symbol
    : null
  const value = displayAmount ? new BigNumber(displayAmount.value) : null
  const sign = value?.isNegative() ? '-' : showExplicitPositiveSign ? '+' : ''
  const formatAmount = getFormatFunction(formatType)
  const formattedValue =
    value && displayCurrency ? formatAmount(value.absoluteValue(), displayCurrency) : '-'
  const includesLowerThanSymbol = formattedValue.startsWith('<')
  const code = displayAmount?.currencyCode
  const fullCurrencyName = getFullCurrencyName(amountCurrency)

  const color = useColors
    ? amountCurrency === Currency.Celo
      ? colors.goldBrand
      : colors.greenBrand
    : StyleSheet.flatten(style)?.color

  if (type === DisplayType.Big) {
    // In this type the symbol is displayed as superscript
    // the downside is we have to workaround React Native not supporting it
    // and have to involve a View, which prevents this type to be embedded into a Text node
    // see https://medium.com/@aaronmgdr/a-better-superscript-in-react-native-591b83db6caa
    const fontSize = size
    const signStyle: StyleProp<TextStyle> = {
      fontSize: Math.round(fontSize * BIG_SIGN_RATIO),
      color,
    }
    const symbolStyle: StyleProp<TextStyle> = getBigSymbolStyle(fontSize, color)
    const lineHeight = Math.round(fontSize * BIG_LINE_HEIGHT_RATIO)
    const amountStyle: StyleProp<TextStyle> = { fontSize, lineHeight, color }
    const codeStyle: StyleProp<TextStyle> = {
      fontSize: Math.round(fontSize * BIG_CODE_RATIO),
      lineHeight,
      color,
    }

    return (
      <View style={[styles.bigContainer, style]} testID={testID}>
        {!hideSign && (
          <Text numberOfLines={1} style={[fontStyles.regular, signStyle]}>
            {sign}
          </Text>
        )}
        {includesLowerThanSymbol && (
          <Text numberOfLines={1} style={[fontStyles.regular, symbolStyle]}>
            {'<'}
          </Text>
        )}
        {!hideSymbol && (
          <Text numberOfLines={1} style={[fontStyles.regular, symbolStyle]}>
            {currencySymbol}
          </Text>
        )}
        <Text numberOfLines={1} style={[styles.bigCurrency, amountStyle]}>
          {formattedValue.substring(includesLowerThanSymbol ? 1 : 0)}
        </Text>
        {!hideCode && !!code && (
          <Text numberOfLines={1} style={[styles.bigCurrencyCode, codeStyle]}>
            {code}
          </Text>
        )}
      </View>
    )
  }

  return (
    <Text style={[style, { color }]} testID={`${testID}/value`}>
      {!hideSign && sign}
      {includesLowerThanSymbol && '<'}
      {!hideSymbol && currencySymbol}
      {formattedValue.substring(includesLowerThanSymbol ? 1 : 0)}
      {!hideCode && !!code && ` ${code}`}
      {!hideFullCurrencyName && !!fullCurrencyName && ` ${fullCurrencyName}`}
    </Text>
  )
}

CurrencyDisplay.defaultProps = {
  type: DisplayType.Default,
  size: 48,
  useColors: false,
  hideSign: false,
  hideSymbol: false,
  hideCode: true,
  showExplicitPositiveSign: false,
  formatType: FormatType.Default,
  hideFullCurrencyName: true,
}

const styles = StyleSheet.create({
  bigContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  bigCurrency: {
    ...fontStyles.regular,
    paddingHorizontal: 3,
  },
  bigCurrencyCode: {
    ...fontStyles.regular,
    marginLeft: 7,
    alignSelf: 'flex-end',
  },
})
