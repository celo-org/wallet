import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import CopyIcon from 'src/icons/CopyIcon'
import Logger from 'src/utils/Logger'

interface Props {
  shortLink: string
  touchDisabled?: boolean
}

export default function ShortAccountLink({ shortLink, touchDisabled }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const onPressLink = () => {
    if (!shortLink.length) {
      return
    }
    Clipboard.setString(shortLink)
    Logger.showMessage(t('shortlinkCopied'))
  }
  // Remove 'https://' from displayed link
  // TODO (anton): create helper fn for this replacement
  const shorterLink = shortLink.replace(/^https?\:\/\//i, '')
  const formattedLink = (
    <View style={styles.line}>
      <Text style={styles.text}>{shorterLink}</Text>
      <CopyIcon />
    </View>
  )

  return touchDisabled ? (
    <View style={styles.container}>{formattedLink}</View>
  ) : (
    <TouchableOpacity style={styles.container} onLongPress={onPressLink} onPress={onPressLink}>
      {formattedLink}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray2,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 24,
  },
  line: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    ...fontStyles.large,
    color: colors.dark,
  },
})
