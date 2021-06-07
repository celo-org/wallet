import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/stableToken/actions'
import { Currency, StableCurrency } from 'src/utils/currencies'

export interface State {
  balances: {
    [currency in StableCurrency]: string | null
  }
  lastFetch: number | null
  educationCompleted: boolean
}

export const initialState = {
  balances: {
    [Currency.Dollar]: null,
    [Currency.Euro]: null,
  },
  balance: null,
  cEurBalance: null,
  lastFetch: null,
  educationCompleted: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_BALANCE:
      return {
        ...state,
        balances: {
          ...state.balances,
          ...action.balances,
        },
        lastFetch: Date.now(),
      }
    case Actions.SET_EDUCATION_COMPLETED:
      return {
        ...state,
        educationCompleted: action.educationCompleted,
      }
    default:
      return state
  }
}

export const balancesSelector = (state: RootState) => state.stableToken.balances
export const cUsdBalanceSelector = (state: RootState) =>
  state.stableToken.balances[Currency.Dollar] ?? null
export const cEurBalanceSelector = (state: RootState) =>
  state.stableToken.balances[Currency.Euro] ?? null
