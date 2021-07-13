import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountNumber from 'src/components/AccountNumber'
import BackButton from 'src/components/BackButton'
import { EXCHANGE_PROVIDER_LINKS } from 'src/config'
import i18n from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

export const externalExchangesScreenOptions = () => {
  const eventName = FiatExchangeEvents.cico_external_exchanges_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: i18n.t('fiatExchangeFlow:exchanges'),
  }
}

export interface ExternalExchangeProvider {
  name: string
  link: string
  currencies: Currency[]
}

type Props = StackScreenProps<StackParamList, Screens.ExternalExchanges>

function ExternalExchanges({ route }: Props) {
  const account = useSelector(currentAccountSelector)

  const goToProvider = (provider: ExternalExchangeProvider) => {
    const { name, link } = provider
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.external_exchange_link, {
        name,
        link,
      })
      navigateToURI(link)
    }
  }

  const { t } = useTranslation('fiatExchangeFlow')

  // TODO Dynamically fetch exchange provider links so they can be updated between releases
  const providers: ExternalExchangeProvider[] = EXCHANGE_PROVIDER_LINKS.filter(
    (provider) => provider.currencies.indexOf(route.params.currency) >= 0
  )

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.pleaseSelectProvider}>
          {t('youCanTransfer', {
            currency: route.params.currency === Currency.Dollar ? t('celoDollars') : 'CELO',
          })}
        </Text>
        <View testID="accountBox" style={styles.accountBox}>
          <Text style={styles.accountLabel}>{t('sendFlow7:accountNumberLabel')}</Text>
          <AccountNumber address={account || ''} location={Screens.ExternalExchanges} />
        </View>
        <View style={styles.providersContainer}>
          {providers.map((provider, idx) => {
            return (
              <ListItem key={provider.name} onPress={goToProvider(provider)}>
                <View testID={provider.name} style={styles.providerListItem}>
                  <Text style={styles.optionTitle}>{provider.name}</Text>
                  <LinkArrow />
                </View>
              </ListItem>
            )
          })}
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: variables.contentPadding,
  },
  pleaseSelectProvider: {
    ...fontStyles.regular,
    paddingHorizontal: variables.contentPadding,
    paddingBottom: variables.contentPadding,
  },
  accountBox: {
    borderRadius: 4,
    backgroundColor: colors.gray2,
    flexDirection: 'column',
    padding: variables.contentPadding,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  accountLabel: {
    ...fontStyles.label,
    color: colors.gray5,
  },
  providerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providersContainer: {
    paddingRight: variables.contentPadding,
  },
  optionTitle: {
    ...fontStyles.regular,
  },
})

export default ExternalExchanges
