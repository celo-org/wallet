import { createSelector } from 'reselect'
import { e164NumberSelector } from 'src/account/selectors'
import { hasExceededKomenciErrorQuota } from 'src/identity/feelessVerificationErrors'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { RootState } from 'src/redux/reducers'
import {
  isBalanceSufficientForSigRetrievalSelector,
  komenciContextSelector,
  shouldUseKomenciSelector,
  verificationStatusSelector,
} from 'src/verify/reducer'
import { accountAddressSelector, currentAccountSelector } from 'src/web3/selectors'

export const getRequirePinOnAppOpen = (state: RootState) => {
  return state.app.requirePinOnAppOpen
}

export const getAppState = (state: RootState) => {
  return state.app.appState
}

export const getAppLocked = (state: RootState) => {
  return state.app.locked
}

export const getLastTimeBackgrounded = (state: RootState) => {
  return state.app.lastTimeBackgrounded
}

export const sessionIdSelector = (state: RootState) => {
  return state.app.sessionId
}

export const verificationPossibleSelector = (state: RootState): boolean => {
  const e164Number = e164NumberSelector(state)
  const saltCache = e164NumberToSaltSelector(state)
  const shouldUseKomenci = shouldUseKomenciSelector(state)
  const { komenci } = verificationStatusSelector(state)
  const hideVerification = hideVerificationSelector(state)
  if (hideVerification) {
    return false
  }

  const { errorTimestamps } = komenciContextSelector(state)

  return !!(
    !hasExceededKomenciErrorQuota(errorTimestamps) &&
    ((e164Number && saltCache[e164Number] && !komenci) ||
      isBalanceSufficientForSigRetrievalSelector(state) ||
      shouldUseKomenci)
  )
}

export const numberVerifiedSelector = (state: RootState) => state.app.numberVerified

// this can be called with undefined state in the tests
export const walletConnectEnabledSelector = (state?: RootState) =>
  state?.app.walletConnectEnabled ?? false

export const shortVerificationCodesEnabledSelector = (state: RootState) =>
  state.app.shortVerificationCodesEnabled

export const hideVerificationSelector = (state: RootState) => state.app.hideVerification

export const ranVerificationMigrationSelector = (state: RootState) =>
  state.app.ranVerificationMigrationAt

// showRaiseDailyLimitTarget is an account string that represents the cutoff of which accounts
// should return true. By doing a string comparison, if the user's account is lower than the
// target we'll return true and false otherwise.
export const showRaiseDailyLimitSelector = createSelector(
  [currentAccountSelector, (state) => state.app.showRaiseDailyLimitTarget],
  (account, showRaiseDailyLimitTarget) => {
    if (!showRaiseDailyLimitTarget || !account) {
      return false
    }
    return account < showRaiseDailyLimitTarget
  }
)

export const rewardsThresholdSelector = (state: RootState) => state.app.rewardsABTestThreshold
export const rewardsEnabledSelector = createSelector(
  [accountAddressSelector, rewardsThresholdSelector],
  (address, rewardsThreshold) => {
    return address! < rewardsThreshold
  }
)

export const logPhoneNumberTypeEnabledSelector = (state: RootState) =>
  state.app.logPhoneNumberTypeEnabled

export const celoEuroEnabledSelector = (state: RootState) => state.app.celoEuroEnabled
