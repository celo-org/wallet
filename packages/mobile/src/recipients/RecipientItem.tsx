import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import { Namespaces, withTranslation } from 'src/i18n'
import Logo, { LogoTypes } from 'src/icons/Logo'
import {
  getDisplayDetail,
  getDisplayName,
  Recipient,
  recipientHasAddress,
} from 'src/recipients/recipient'
import GetRewardPill from 'src/send/GetRewardPill'

interface OwnProps {
  recipient: Recipient
  onSelectRecipient(recipient: Recipient): void
}

type Props = OwnProps & WithTranslation

class RecipientItem extends React.PureComponent<Props> {
  onPress = () => {
    this.props.onSelectRecipient(this.props.recipient)
  }

  render() {
    const { recipient, t } = this.props

    return (
      <Touchable onPress={this.onPress} testID="RecipientItem">
        <View style={styles.row}>
          <ContactCircle style={styles.avatar} recipient={recipient} />
          <View style={styles.contentContainer}>
            <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.name}>
              {getDisplayName(recipient, t)}
            </Text>
            {recipient.name ? (
              <Text style={styles.phone}>{getDisplayDetail(recipient)}</Text>
            ) : null}
          </View>
          <View style={styles.rightIconContainer}>
            {recipientHasAddress(recipient) ? (
              <Logo style={styles.logo} type={LogoTypes.GREEN} height={24} />
            ) : (
              <GetRewardPill />
            )}
          </View>
        </View>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: variables.contentPadding,
    flex: 1,
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
    marginRight: 20,
  },
})

export default withTranslation<Props>(Namespaces.paymentRequestFlow)(RecipientItem)
