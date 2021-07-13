import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { parseInputAmount } from '@celo/utils/lib/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { MoneyAmount } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay, { getFullCurrencyName } from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import LineItemRow from 'src/components/LineItemRow'
import { GOLD_TRANSACTION_MIN_AMOUNT, STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import ExchangeTradeScreenHeader from 'src/exchange/ExchangeScreenHeader'
import { ExchangeRates, exchangeRatesSelector } from 'src/exchange/reducer'
import { Namespaces, withTranslation } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  convertCurrencyToLocalAmount,
  convertLocalAmountToCurrency,
  convertToMaxSupportedPrecision,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { updateLastUsedCurrency } from 'src/send/actions'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { balancesSelector, defaultCurrencySelector } from 'src/stableToken/selectors'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import Logger from 'src/utils/Logger'

const { decimalSeparator } = getNumberFormatSettings()

export enum InputToken {
  Celo = 'Celo',
  LocalCurrency = 'LocalCurrency',
}

interface State {
  inputToken: InputToken
  buyCelo: boolean
  inputAmount: string
  exchangeRateInfoDialogVisible: boolean
  transferCurrency: Currency
}

interface StateProps {
  exchangeRates: ExchangeRates | null
  error: ErrorMessages | null
  localCurrencyCode: LocalCurrencyCode
  balances: Record<Currency, BigNumber | null>
  localCurrencyExchangeRates: Record<Currency, string | null>
  defaultCurrency: Currency
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  showError: typeof showError
  hideAlert: typeof hideAlert
  updateLastUsedCurrency: typeof updateLastUsedCurrency
}

type OwnProps = StackScreenProps<StackParamList, Screens.ExchangeTradeScreen>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRates: exchangeRatesSelector(state),
  error: errorSelector(state),
  localCurrencyCode: getLocalCurrencyCode(state),
  balances: balancesSelector(state),
  localCurrencyExchangeRates: localCurrencyExchangeRatesSelector(state),
  defaultCurrency: defaultCurrencySelector(state),
})

export class ExchangeTradeScreen extends React.Component<Props, State> {
  state: State = {
    inputToken: InputToken.Celo,
    buyCelo: true,
    inputAmount: '', // Raw amount entered, can be cGLD, cUSD or local currency
    exchangeRateInfoDialogVisible: false,
    transferCurrency: Currency.Dollar,
  }

  componentDidMount() {
    this.getSellTokenPropertiesFromNavProps()
  }

  getSellTokenPropertiesFromNavProps = () => {
    const { buyCelo } = this.props.route.params
    const { defaultCurrency, balances } = this.props

    this.setState({
      buyCelo,
      transferCurrency: defaultCurrency,
    })

    const sellToken = buyCelo ? defaultCurrency : Currency.Celo
    if (!balances[sellToken]) {
      Logger.error('ExchangeTradeScreen', `${sellToken} balance is missing. Should never happen`)
      this.props.showError(ErrorMessages.FETCH_FAILED)
      navigateBack()
      return
    }

    this.props.fetchExchangeRate(sellToken, balances[sellToken]!)
  }

  onChangeExchangeAmount = (amount: string) => {
    this.setState({ inputAmount: amount }, () => {
      this.updateError()
    })
  }

  updateError = () => {
    const tokenAmount = this.getInputTokenAmount()
    if (!this.inputAmountIsValid(tokenAmount)) {
      this.props.showError(
        this.state.buyCelo ? ErrorMessages.NSF_STABLE : ErrorMessages.NSF_GOLD,
        null,
        { token: getFullCurrencyName(this.state.transferCurrency) }
      )
    } else {
      this.props.hideAlert()
    }
  }

  goToReview = () => {
    const { buyCelo, inputToken, transferCurrency } = this.state
    const inputAmount = this.getInputTokenAmount()
    // BEGIN: Analytics
    const exchangeRate = getRateForMakerToken(
      this.props.exchangeRates,
      Currency.Celo,
      transferCurrency
    )
    const celoAmount =
      inputToken === InputToken.Celo ? inputAmount : exchangeRate.multipliedBy(inputAmount)
    const stableAmount =
      inputToken === InputToken.Celo ? exchangeRate.pow(-1).multipliedBy(inputAmount) : inputAmount
    const localCurrencyAmount = convertCurrencyToLocalAmount(
      stableAmount,
      this.props.localCurrencyExchangeRates[transferCurrency]
    )
    const inputCurrency = inputToken === InputToken.Celo ? Currency.Celo : transferCurrency
    ValoraAnalytics.track(
      buyCelo ? CeloExchangeEvents.celo_buy_continue : CeloExchangeEvents.celo_sell_continue,
      {
        localCurrencyAmount: localCurrencyAmount?.toString() ?? null,
        goldAmount: celoAmount.toString(),
        inputToken: inputCurrency,
      }
    )
    // END: Analytics
    const makerToken = this.getMakerToken()
    navigate(Screens.ExchangeReview, {
      makerToken: makerToken,
      takerToken: this.getTakerToken(),
      celoAmount,
      stableAmount,
      inputToken: inputCurrency,
      inputTokenDisplayName: this.getInputTokenDisplayText(),
      inputAmount,
    })
    this.props.updateLastUsedCurrency(transferCurrency)
  }

  hasError = () => {
    return !!this.props.error
  }

  // |tokenAmount| will be in CELO if inputToken === Celo or in |transferCurrency| otherwise.
  inputAmountIsValid = (tokenAmount: BigNumber) => {
    const { buyCelo, inputToken, transferCurrency } = this.state
    const { balances } = this.props

    if (buyCelo) {
      if (inputToken === InputToken.Celo) {
        const exchangeRate = getRateForMakerToken(
          this.props.exchangeRates,
          Currency.Celo,
          transferCurrency
        )
        return getTakerAmount(tokenAmount, exchangeRate).isLessThanOrEqualTo(
          balances[transferCurrency] ?? 0
        )
      } else {
        return tokenAmount.isLessThanOrEqualTo(balances[transferCurrency] ?? 0)
      }
    } else {
      // Selling CELO
      if (inputToken === InputToken.Celo) {
        return tokenAmount.isLessThanOrEqualTo(balances[Currency.Celo] ?? 0)
      } else {
        const exchangeRate = getRateForMakerToken(
          this.props.exchangeRates,
          transferCurrency,
          Currency.Celo
        )
        return getTakerAmount(tokenAmount, exchangeRate).isLessThanOrEqualTo(
          balances[Currency.Celo] ?? 0
        )
      }
    }
  }

  getMakerToken = () => {
    const { buyCelo, transferCurrency } = this.state
    return buyCelo ? transferCurrency : Currency.Celo
  }

  getTakerToken = () => {
    const { buyCelo, transferCurrency } = this.state
    return buyCelo ? Currency.Celo : transferCurrency
  }

  isExchangeInvalid = () => {
    const tokenAmount = this.getInputTokenAmount()

    const amountIsInvalid =
      !this.inputAmountIsValid(tokenAmount) ||
      tokenAmount.isLessThan(
        this.isLocalCurrencyInput() ? STABLE_TRANSACTION_MIN_AMOUNT : GOLD_TRANSACTION_MIN_AMOUNT
      )

    const exchangeRate = getRateForMakerToken(
      this.props.exchangeRates,
      this.getMakerToken(),
      this.getTakerToken()
    )
    const exchangeRateIsInvalid = exchangeRate.isLessThanOrEqualTo(0)
    const takerToken = this.getTakerToken()
    const takerAmountIsInvalid = getTakerAmount(
      tokenAmount,
      exchangeRate,
      CURRENCIES[takerToken].displayDecimals
    ).isLessThanOrEqualTo(0)

    return amountIsInvalid || exchangeRateIsInvalid || takerAmountIsInvalid || this.hasError()
  }

  isLocalCurrencyInput = () => {
    return this.state.inputToken === InputToken.LocalCurrency
  }

  getInputValue = () => {
    if (this.state.inputAmount) {
      return this.state.inputAmount
    } else {
      return ''
    }
  }

  // Output is one of |CURRENCIES| based on input token
  // Local amounts are converted to one of |STABLE_CURRENCIES|.
  getInputTokenAmount = () => {
    const { inputAmount, inputToken, transferCurrency } = this.state
    const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)

    if (inputToken === InputToken.Celo) {
      return parsedInputAmount
    }

    const { localCurrencyExchangeRates } = this.props

    const stableAmount =
      convertLocalAmountToCurrency(
        parsedInputAmount,
        localCurrencyExchangeRates[transferCurrency]
      ) || new BigNumber('')

    return convertToMaxSupportedPrecision(stableAmount)
  }

  getInputTokenDisplayText = () => {
    return this.isLocalCurrencyInput() ? this.props.localCurrencyCode : this.props.t('global:gold')
  }

  getOppositeInputTokenDisplayText = () => {
    return this.isLocalCurrencyInput() ? this.props.t('global:gold') : this.props.localCurrencyCode
  }

  getOppositeInputToken = () => {
    return this.isLocalCurrencyInput() ? InputToken.Celo : InputToken.LocalCurrency
  }

  switchInputToken = () => {
    const inputToken = this.getOppositeInputToken()
    ValoraAnalytics.track(CeloExchangeEvents.celo_toggle_input_currency, {
      to: inputToken,
    })
    this.setState({ inputToken }, () => {
      this.updateError()
    })
  }

  getSubtotalAmount = (): MoneyAmount => {
    const { inputToken, transferCurrency } = this.state
    const exchangeRate = getRateForMakerToken(
      this.props.exchangeRates,
      inputToken === InputToken.Celo ? Currency.Celo : transferCurrency,
      inputToken === InputToken.Celo ? transferCurrency : Currency.Celo
    )
    const tokenAmount = this.getInputTokenAmount()
    const subtotalAmount = getTakerAmount(tokenAmount, exchangeRate)

    return {
      value: subtotalAmount,
      currencyCode: inputToken === InputToken.Celo ? transferCurrency : Currency.Celo,
    }
  }

  toggleExchangeRateInfoDialog = () => {
    this.setState((state) => ({
      exchangeRateInfoDialogVisible: !state.exchangeRateInfoDialogVisible,
    }))
  }

  updateTransferCurrency = (currency: Currency) => this.setState({ transferCurrency: currency })

  render() {
    const { buyCelo } = this.props.route.params
    const { t, exchangeRates } = this.props
    const { transferCurrency, exchangeRateInfoDialogVisible } = this.state

    const exchangeRateDisplay = getRateForMakerToken(exchangeRates, transferCurrency, Currency.Celo)

    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
        <ExchangeTradeScreenHeader
          currency={transferCurrency}
          isCeloPurchase={buyCelo}
          onChangeCurrency={this.updateTransferCurrency}
        />
        <DisconnectBanner />
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={'always'}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.amountInputContainer}>
            <View>
              <Text style={styles.exchangeBodyText}>
                {t('exchangeAmount', { tokenName: this.getInputTokenDisplayText() })}
              </Text>
              <TouchableOpacity onPress={this.switchInputToken} testID="ExchangeSwitchInput">
                <Text style={styles.switchToText}>
                  {t('switchTo', { tokenName: this.getOppositeInputTokenDisplayText() })}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              autoFocus={true}
              keyboardType={'decimal-pad'}
              autoCapitalize="words"
              onChangeText={this.onChangeExchangeAmount}
              value={this.getInputValue()}
              placeholderTextColor={colors.gray3}
              placeholder={'0'}
              style={styles.currencyInput}
              testID="ExchangeInput"
            />
          </View>
          <LineItemRow
            textStyle={styles.subtotalBodyText}
            title={
              <Trans
                i18nKey="inputSubtotal"
                tOptions={{ context: this.isLocalCurrencyInput() ? 'gold' : null }}
                ns={Namespaces.exchangeFlow9}
              >
                Subtotal @{' '}
                <CurrencyDisplay
                  amount={{
                    value: exchangeRateDisplay,
                    currencyCode: transferCurrency,
                  }}
                />
              </Trans>
            }
            amount={<CurrencyDisplay amount={this.getSubtotalAmount()} />}
          />
        </KeyboardAwareScrollView>
        <TouchableOpacity onPress={this.toggleExchangeRateInfoDialog}>
          <LineItemRow
            title={t('exchangeRateInfo')}
            titleIcon={<InfoIcon size={14} />}
            style={styles.exchangeRateInfo}
            textStyle={styles.exchangeRateInfoText}
          />
        </TouchableOpacity>
        <Button
          onPress={this.goToReview}
          text={t(`global:review`)}
          accessibilityLabel={t('continue')}
          disabled={this.isExchangeInvalid()}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.reviewBtn}
          testID="ExchangeReviewButton"
        />
        <Dialog
          title={t('rateInfoTitle')}
          isVisible={exchangeRateInfoDialogVisible}
          actionText={t('global:dismiss')}
          actionPress={this.toggleExchangeRateInfoDialog}
        >
          {t('rateInfoBody')}
        </Dialog>
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  fetchExchangeRate,
  showError,
  hideAlert,
  updateLastUsedCurrency,
})(withTranslation<Props>(Namespaces.exchangeFlow9)(ExchangeTradeScreen))

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    marginTop: 38,
    alignItems: 'center',
    marginBottom: 8,
  },
  exchangeBodyText: {
    ...fontStyles.regular500,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  subtotalBodyText: {
    ...fontStyles.small,
  },
  switchToText: {
    ...fontStyles.small,
    fontSize: 13,
    textDecorationLine: 'underline',
    color: colors.gray4,
    marginTop: 4,
  },
  currencyInput: {
    ...fontStyles.regular,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 24,
    lineHeight: Platform.select({ android: 39, ios: 30 }), // vertical align = center
    height: 60, // setting height manually b.c. of bug causing text to jump on Android
    color: colors.goldDark,
  },
  exchangeRateInfo: {
    justifyContent: 'center',
  },
  exchangeRateInfoText: {
    ...fontStyles.small,
    color: colors.gray5,
    marginRight: 4,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})
