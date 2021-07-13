import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { default as useSelector } from 'src/redux/useSelector'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/lib'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import BigNumber from 'bignumber.js'
import Touchable from '@celo/react-components/components/Touchable'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import CurrencyDisplay from 'src/components/CurrencyDisplay'

export interface SelectCurrencyProps {
  selectedCurrency: CURRENCY_ENUM
  onSelect: (currency: CURRENCY_ENUM) => void
}

function SelectCurrency({ selectedCurrency, onSelect }: SelectCurrencyProps) {
  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const dollarAmount = {
    value: dollarBalance ?? '0',
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }
  const celoBalance = useSelector(celoTokenBalanceSelector)
  const celoAmount = {
    value: new BigNumber(celoBalance ?? '0'),
    currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
  }

  const selectCurrency = (currency: CURRENCY_ENUM) =>
    React.useCallback(() => {
      onSelect(currency)
    }, [onSelect])

  return (
    <>
      <Touchable
        onPress={selectCurrency(CURRENCY_ENUM.GOLD)}
        style={[styles.row, selectedCurrency === CURRENCY_ENUM.GOLD ? styles.rowSelected : null]}
      >
        <>
          <Text style={styles.title}>CELO Balance</Text>
          <View style={styles.currency}>
            <CurrencyDisplay
              style={fontStyles.regular500}
              amount={celoAmount}
              showLocalAmount={true}
            />
            <CurrencyDisplay
              style={styles.amountLabelSmall}
              amount={celoAmount}
              showLocalAmount={false}
              hideFullCurrencyName={false}
              hideSymbol={true}
            />
          </View>
        </>
      </Touchable>
      <Touchable
        onPress={selectCurrency(CURRENCY_ENUM.DOLLAR)}
        style={[styles.row, selectedCurrency === CURRENCY_ENUM.DOLLAR ? styles.rowSelected : null]}
      >
        <>
          <Text style={styles.title}>cUSD Balance</Text>
          <View style={styles.currency}>
            <CurrencyDisplay
              style={fontStyles.regular500}
              amount={dollarAmount}
              showLocalAmount={true}
            />
            <CurrencyDisplay
              style={styles.amountLabelSmall}
              amount={dollarAmount}
              showLocalAmount={false}
              hideFullCurrencyName={false}
              hideSymbol={true}
            />
          </View>
        </>
      </Touchable>
    </>
  )
}

export default SelectCurrency

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rowSelected: {
    backgroundColor: '#ECFBF3',
  },
  title: {
    lineHeight: 22,
    fontSize: 16,
  },
  currency: {
    alignItems: 'flex-end',
  },
  amountLabelSmall: {
    color: colors.gray4,
  },
})
