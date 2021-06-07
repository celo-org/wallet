import { Actions, ActionTypes } from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Currency } from 'src/utils/currencies'

export interface State {
  isLoading: boolean
  preferredCurrencyCode?: LocalCurrencyCode
  exchangeRates: { [token in Currency]: string | null }
  lastSuccessfulUpdate?: number
  fetchedCurrencyCode?: LocalCurrencyCode
  fetchRateFailed: boolean
}

const initialState = {
  isLoading: false,
  fetchRateFailed: false,
  exchangeRates: {
    [Currency.Celo]: null,
    [Currency.Dollar]: null,
    [Currency.Euro]: null,
  },
}

export const reducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const persistedState = getRehydratePayload(action, 'localCurrency')

      // Ignore some persisted properties
      return {
        ...state,
        ...persistedState,
        isLoading: false,
      }
    }
    case Actions.FETCH_CURRENT_RATE:
      return {
        ...state,
        isLoading: true,
        fetchRateFailed: false,
      }
    case Actions.FETCH_CURRENT_RATE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        fetchRateFailed: false,
        exchangeRates: {
          ...state.exchangeRates,
          ...action.exchangeRates,
        },
        lastSuccessfulUpdate: action.now,
        fetchedCurrencyCode: action.currencyCode,
      }
    case Actions.FETCH_CURRENT_RATE_FAILURE:
      return {
        ...state,
        isLoading: false,
        fetchRateFailed: true,
      }
    case Actions.SELECT_PREFERRED_CURRENCY:
      return {
        ...state,
        preferredCurrencyCode: action.currencyCode,
      }
    default:
      return state
  }
}
