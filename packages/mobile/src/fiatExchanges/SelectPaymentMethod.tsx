import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { default as useSelector } from 'src/redux/useSelector'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import BigNumber from 'bignumber.js'
import Touchable from '@celo/react-components/components/Touchable'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeIntegratedAmount'

export interface SelectPaymentMethodProps {
  selectedMethod: PaymentMethod
  onSelect: (currency: PaymentMethod) => void
}

function SelectPaymentMethod({ selectedMethod, onSelect }: SelectPaymentMethodProps) {
  const selectMethod = (currency: PaymentMethod) =>
    React.useCallback(() => {
      onSelect(currency)
    }, [onSelect])

  return (
    <>
      <Touchable onPress={selectMethod(PaymentMethod.Card)} style={[styles.row, styles.rowFirst]}>
        <>
          <View style={styles.icon}>
            <Text>🚀</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Debit Card</Text>
            <Text style={styles.description}>
              Fast and secure way to add funds with your debit card!
            </Text>
          </View>
        </>
      </Touchable>
      <Touchable onPress={selectMethod(PaymentMethod.Bank)} style={[styles.row, styles.rowFirst]}>
        <>
          <View style={styles.icon}>
            <Text>🏦</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Bank Account</Text>
            <Text style={styles.description}>
              Anywhere any time through something really useful
            </Text>
          </View>
        </>
      </Touchable>
    </>
  )
}

export default SelectPaymentMethod

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    alignItems: 'flex-start',
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
    borderStyle: 'solid',
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...fontStyles.regular500,
  },
  description: {
    ...fontStyles.small,
  },
})
