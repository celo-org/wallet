import { getRegionCode } from '@celo/utils/lib/phoneNumbers'
import CountryData from 'country-data'
import { getCurrencies } from 'react-native-localize'
import { createSelector } from 'reselect'
import { e164NumberSelector } from 'src/account/selectors'
import { LocalCurrencyCode, LOCAL_CURRENCY_CODES } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

function getCountryCurrencies(e164PhoneNumber: string) {
  const regionCode = getRegionCode(e164PhoneNumber)
  const countries = CountryData.lookup.countries({ alpha2: regionCode })
  const country = countries.length > 0 ? countries[0] : undefined

  return country ? country.currencies : []
}

const getDefaultLocalCurrencyCode = createSelector(
  e164NumberSelector,
  (e164PhoneNumber): LocalCurrencyCode => {
    // Note: we initially tried using the device locale for getting the currencies (`RNLocalize.getCurrencies()`)
    // but the problem is some Android versions don't make it possible to select the appropriate language/country
    // from the device settings.
    // So here we use the country of the phone number
    const countryCurrencies = e164PhoneNumber
      ? getCountryCurrencies(e164PhoneNumber)
      : getCurrencies()
    const supportedCurrenciesSet = new Set(LOCAL_CURRENCY_CODES)

    for (const countryCurrency of countryCurrencies) {
      if (supportedCurrenciesSet.has(countryCurrency as LocalCurrencyCode)) {
        return countryCurrency as LocalCurrencyCode
      }
    }

    return LocalCurrencyCode.USD
  }
)

export function getWalletConnectClient(state: RootState) {
  return state.walletConnect.client
}
