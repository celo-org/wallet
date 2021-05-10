import { useSelector } from 'react-redux'
import { balancesSelector } from 'src/stableToken/selectors'
import { Currency } from 'src/utils/currencies'

export function useCurrencyBalance(currency: Currency) {
  const balances = useSelector(balancesSelector)
  return balances[currency]
}
