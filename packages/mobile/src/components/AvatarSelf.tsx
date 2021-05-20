import * as React from 'react'
import { TextStyle } from 'react-native'
import { nameSelector, pictureSelector, userContactDetailsSelector } from 'src/account/selectors'
import Avatar from 'src/components/Avatar'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  iconSize?: number
  displayNameStyle?: TextStyle
}

// An avatar for the wallet user themselves
export function AvatarSelf({ iconSize, displayNameStyle }: Props) {
  const displayName = useSelector(nameSelector)
  const userPicture = useSelector(pictureSelector)
  const contactDetails = useSelector(userContactDetailsSelector)
  const account = useSelector(currentAccountSelector)

  // Recipient refering to the wallet user, used for the avatar
  let recipient: Recipient
  if (displayName) {
    recipient = {
      contactId: contactDetails.contactId || 'none',
      thumbnailPath: userPicture || contactDetails.thumbnailPath || undefined,
      name: displayName,
      address: account!,
    }
  } else {
    recipient = {
      address: account!,
      name: displayName || undefined,
    }
  }

  return <Avatar recipient={recipient} iconSize={iconSize} displayNameStyle={displayNameStyle} />
}
