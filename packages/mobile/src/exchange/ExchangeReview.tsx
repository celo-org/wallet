import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { exchangeTokens, fetchExchangeRate, fetchTobinTax } from 'src/exchange/actions'
import { ExchangeRates } from 'src/exchange/reducer'
import { Namespaces, withTranslation } from 'src/i18n'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

interface StateProps {
  exchangeRates: ExchangeRates | null
  tobinTax: BigNumber
  fee: BigNumber
  appConnected: boolean
  localCurrencyExchangeRates: Record<Currency, string | null>
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  fetchTobinTax: typeof fetchTobinTax
  exchangeTokens: typeof exchangeTokens
}

interface State {
  transferCurrency: Currency
}

type OwnProps = StackScreenProps<StackParamList, Screens.ExchangeReview>

type Props = StateProps & WithTranslation & DispatchProps & OwnProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRates: state.exchange.exchangeRates,
  tobinTax: new BigNumber(state.exchange.tobinTax || 0),
  // TODO: use real fee
  fee: new BigNumber(0),
  appConnected: isAppConnected(state),
  localCurrencyExchangeRates: localCurrencyExchangeRatesSelector(state),
})

export class ExchangeReview extends React.Component<Props, State> {
  onPressConfirm = () => {
    const {
      makerToken,
      takerToken,
      celoAmount,
      stableAmount,
      inputToken,
      inputAmount,
    } = this.props.route.params
    const stableToken = makerToken === Currency.Celo ? takerToken : makerToken

    // BEGIN: Analytics
    const localCurrencyAmount = convertCurrencyToLocalAmount(
      stableAmount,
      this.props.localCurrencyExchangeRates[stableToken]
    )
    ValoraAnalytics.track(
      makerToken !== Currency.Celo
        ? CeloExchangeEvents.celo_buy_confirm
        : CeloExchangeEvents.celo_sell_confirm,
      {
        localCurrencyAmount: localCurrencyAmount?.toString() ?? null,
        goldAmount: celoAmount.toString(),
        stableAmount: stableAmount.toString(),
        inputToken,
      }
    )

    const makerTokenAmount = makerToken === Currency.Celo ? celoAmount : stableAmount
    this.props.exchangeTokens(makerToken, makerTokenAmount, takerToken, inputAmount)
  }

  componentDidMount() {
    const { makerToken, celoAmount, stableAmount } = this.props.route.params
    const makerTokenAmount = makerToken === Currency.Celo ? celoAmount : stableAmount
    this.props.fetchTobinTax(makerTokenAmount, makerToken)
    this.props.fetchExchangeRate(makerToken, makerTokenAmount)
  }

  render() {
    const { exchangeRates, t, appConnected, tobinTax, fee } = this.props
    const {
      makerToken,
      takerToken,
      celoAmount,
      stableAmount,
      inputToken,
      inputAmount,
      inputTokenDisplayName,
    } = this.props.route.params

    const stableToken = makerToken === Currency.Celo ? takerToken : makerToken
    const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Celo, stableToken).pow(-1)

    const exchangeAmount = {
      value: inputAmount,
      currencyCode: inputToken,
    }
    const exchangeRateAmount = {
      value: exchangeRate,
      currencyCode: stableToken,
    }
    const subtotalAmount = {
      value: stableAmount,
      currencyCode: stableToken,
    }
    const totalFee = new BigNumber(tobinTax).plus(fee)

    const totalAmount = {
      value: stableAmount.plus(totalFee),
      currencyCode: stableToken,
    }

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.paddedContainer}>
          <DisconnectBanner />
          <ScrollView>
            <View style={styles.flexStart}>
              <View style={styles.amountRow}>
                <Text style={styles.exchangeBodyText}>
                  {t('exchangeAmount', {
                    tokenName: inputTokenDisplayName,
                  })}
                </Text>
                <CurrencyDisplay style={styles.currencyAmountText} amount={exchangeAmount} />
              </View>
              <HorizontalLine />
              <LineItemRow
                title={
                  <Trans i18nKey="subtotalAmount" ns={Namespaces.exchangeFlow9}>
                    Subtotal @ <CurrencyDisplay amount={exchangeRateAmount} />
                  </Trans>
                }
                amount={<CurrencyDisplay amount={subtotalAmount} />}
              />
              <FeeDrawer
                testID={'feeDrawer/ExchangeReview'}
                currency={Currency.Dollar}
                securityFee={fee}
                exchangeFee={tobinTax}
                isExchange={true}
                totalFee={totalFee}
              />

              <HorizontalLine />
              <TotalLineItem amount={totalAmount} />
            </View>
          </ScrollView>
        </View>
        <Button
          onPress={this.onPressConfirm}
          size={BtnSizes.FULL}
          text={
            <Trans
              i18nKey={makerToken === Currency.Celo ? 'sellGoldAmount' : 'buyGoldAmount'}
              ns={Namespaces.exchangeFlow9}
            >
              <CurrencyDisplay
                amount={{
                  value: celoAmount,
                  currencyCode: Currency.Celo,
                }}
              />
            </Trans>
          }
          style={styles.buyBtn}
          disabled={!appConnected || exchangeRate.isZero()}
          type={BtnTypes.TERTIARY}
          testID="ConfirmExchange"
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  paddedContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.regular,
  },
  currencyAmountText: {
    ...fontStyles.regular,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  buyBtn: {
    padding: variables.contentPadding,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  exchangeTokens,
  fetchExchangeRate,
  fetchTobinTax,
})(withTranslation<Props>(Namespaces.exchangeFlow9)(ExchangeReview))
