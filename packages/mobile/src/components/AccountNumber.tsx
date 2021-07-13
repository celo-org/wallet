import colors from '@celo/react-components/styles/colors'
import fontStyles, { fontFamily } from '@celo/react-components/styles/fonts'
import { getAddressChunks } from '@celo/utils/lib/address'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { FiatExchangeEvents, HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

interface Props {
  address: string
  touchDisabled?: boolean
  location?: Screens
}

export default function AccountNumber({ address, touchDisabled, location }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const onPressAddress = () => {
    if (!address.length) {
      return
    }
    Clipboard.setString(address)
    Logger.showMessage(t('addressCopied'))

    if (location === Screens.DrawerNavigator) {
      ValoraAnalytics.track(HomeEvents.drawer_address_copy)
    }

    if (location === Screens.TransactionReview) {
      ValoraAnalytics.track(HomeEvents.transaction_feed_address_copy)
    }

    if (location === Screens.ExternalExchanges) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_cash_out_copy_address)
    }
  }
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = getAddressChunks(address)
  const addressString = '0x ' + addressChunks.join(' ')

  return touchDisabled ? (
    <Text style={styles.text}>{addressString}</Text>
  ) : (
    <TouchableOpacity
      onLongPress={onPressAddress}
      onPress={onPressAddress}
      testID="CopyAddressToClipboard"
    >
      <Text style={styles.text}>{addressString}</Text>
      <Text style={styles.link}>{t('tapToCopy')}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  line: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
    marginVertical: 8,
  },
  link: {
    ...fontStyles.label,
    textDecorationLine: 'underline',
    color: colors.gray4,
    fontFamily,
  },
})
