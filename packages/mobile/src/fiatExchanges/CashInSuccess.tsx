import Button from '@celo/react-components/components/Button'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces } from 'src/i18n'
import { fiatExchange } from 'src/images/Images'
import { noHeaderGestureDisabled } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.CashInSuccess>
type Props = RouteProps

const capitalizeProvider = (provider?: string) => {
  if (provider) {
    const providerArr = provider.split('')
    providerArr[0].toUpperCase()
    return providerArr.join('')
  }
}

function CashInSuccessScreen({ route }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const { provider } = route.params

  useEffect(() => {
    ValoraAnalytics.track(FiatExchangeEvents.cash_in_success, {
      provider,
    })
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={fiatExchange} resizeMode={'contain'} />
        <Text style={styles.title}>{t('cicoSuccess.title')}</Text>
        <Text style={styles.contentText}>
          {provider
            ? t('cicoSuccess.bodyWithProvider', { provider: capitalizeProvider(provider) })
            : t('cicoSuccess.bodyWithoutProvider')}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          text={t('global:continue')}
          accessibilityLabel={t('global:continue')}
          onPress={navigateHome}
          testID={'SuccessContinue'}
        />
      </View>
    </View>
  )
}

CashInSuccessScreen.navigationOptions = () => ({
  ...noHeaderGestureDisabled,
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    ...fontStyles.large500,
    paddingTop: 8,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    minWidth: 200,
    width: '100%',
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
  },
})

export default CashInSuccessScreen
