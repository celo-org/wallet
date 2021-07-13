import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import { Namespaces } from 'src/i18n'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { getDisplayDetail, getDisplayName, Recipient } from 'src/recipients/recipient'

interface Props {
  recipient: Recipient
  onSelectRecipient(recipient: Recipient): void
}

function RecipientItem({ recipient, onSelectRecipient }: Props) {
  const { t } = useTranslation(Namespaces.paymentRequestFlow)

  const onPress = () => {
    onSelectRecipient(recipient)
  }

  return (
    <Touchable onPress={onPress} testID="RecipientItem">
      <View style={styles.row}>
        <ContactCircle style={styles.avatar} recipient={recipient} />
        <View style={styles.contentContainer}>
          <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.name}>
            {getDisplayName(recipient, t)}
          </Text>
          {recipient.name && <Text style={styles.phone}>{getDisplayDetail(recipient)}</Text>}
        </View>
        <View style={styles.rightIconContainer}>
          {recipient.address ? <Logo style={styles.logo} type={LogoTypes.GREEN} /> : null}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: variables.contentPadding,
    flexWrap: 'wrap',
  },
  avatar: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  name: { ...fontStyles.regular500, color: colors.dark },
  phone: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginRight: 16,
  },
})

export default memo(RecipientItem)
