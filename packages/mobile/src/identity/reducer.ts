import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import dotProp from 'dot-prop-immutable'
import { RehydrateAction } from 'redux-persist'
import { createSelector } from 'reselect'
import { Actions as AccountActions, ClearStoredAccountAction } from 'src/account/actions'
import { Actions, ActionTypes } from 'src/identity/actions'
import { ContactMatches, ImportContactsStatus } from 'src/identity/types'
import { removeKeyFromMapping } from 'src/identity/utils'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { StoreLatestInRecentsAction } from 'src/send/actions'

export interface AddressToE164NumberType {
  [address: string]: string | null
}

export interface E164NumberToAddressType {
  [e164PhoneNumber: string]: string[] | null | undefined // null means unverified
}

export interface E164NumberToSaltType {
  [e164PhoneNumber: string]: string | null // null means unverified
}

export interface IdentifierToE164NumberType {
  [identifier: string]: string | null // null means no number
}

export interface AddressToDataEncryptionKeyType {
  [address: string]: string | null // null means no DEK registered
}

export interface AddressInfoToDisplay {
  name: string
  imageUrl: string | null
  isCeloRewardSender?: boolean
  isProviderAddress?: boolean
}

// This mapping is just for storing provider info from firebase
// other known recipient should be stored in the valoraRecipientCache
export interface AddressToDisplayNameType {
  [address: string]: AddressInfoToDisplay | undefined
}

export interface WalletToAccountAddressType {
  [address: string]: string
}

export interface ImportContactProgress {
  status: ImportContactsStatus
  current: number
  total: number
}

export enum AddressValidationType {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none',
}

export interface SecureSendPhoneNumberMapping {
  [e164Number: string]: SecureSendDetails
}

export interface SecureSendDetails {
  address?: string
  addressValidationType: AddressValidationType
  isFetchingAddresses?: boolean
  lastFetchSuccessful?: boolean
  validationSuccessful?: boolean
}

export interface State {
  // numCompleteAttestations is controlled locally
  hasSeenVerificationNux: boolean
  addressToE164Number: AddressToE164NumberType
  // Note: Do not access values in this directly, use the `getAddressFromPhoneNumber` helper in contactMapping
  e164NumberToAddress: E164NumberToAddressType
  // This contains a mapping of walletAddress (EOA) to accountAddress (either MTW or EOA)
  // and is needed to query for a user's DEK while knowing only their walletAddress
  walletToAccountAddress: WalletToAccountAddressType
  e164NumberToSalt: E164NumberToSaltType
  addressToDataEncryptionKey: AddressToDataEncryptionKeyType
  // Doesn't contain all known addresses, use only as a fallback.
  // TODO: Remove if unused after CIP-8 implementation.
  addressToDisplayName: AddressToDisplayNameType
  // Has the user already been asked for contacts permission
  askedContactsPermission: boolean
  importContactsProgress: ImportContactProgress
  // Contacts found during the matchmaking process
  matchedContacts: ContactMatches
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
}

const initialState: State = {
  hasSeenVerificationNux: false,
  addressToE164Number: {},
  e164NumberToAddress: {},
  walletToAccountAddress: {},
  e164NumberToSalt: {},
  addressToDataEncryptionKey: {},
  addressToDisplayName: {},
  askedContactsPermission: false,
  importContactsProgress: {
    status: ImportContactsStatus.Stopped,
    current: 0,
    total: 0,
  },
  matchedContacts: {},
  secureSendPhoneNumberMapping: {},
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | ClearStoredAccountAction | StoreLatestInRecentsAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      const rehydratedState = getRehydratePayload(action, 'identity')
      return {
        ...state,
        ...rehydratedState,
        importContactsProgress: {
          status: ImportContactsStatus.Stopped,
          current: 0,
          total: 0,
        },
      }
    }
    case Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES:
      return {
        ...state,
        addressToE164Number: { ...state.addressToE164Number, ...action.addressToE164Number },
        e164NumberToAddress: {
          ...state.e164NumberToAddress,
          ...action.e164NumberToAddress,
        },
      }
    case Actions.UPDATE_WALLET_TO_ACCOUNT_ADDRESS:
      return {
        ...state,
        walletToAccountAddress: {
          ...state.walletToAccountAddress,
          ...action.walletToAccountAddress,
        },
      }
    case Actions.REMOVE_WALLET_TO_ACCOUNT_ADDRESS:
      return {
        ...state,
        walletToAccountAddress: removeKeyFromMapping(
          state.walletToAccountAddress,
          action.walletAddress
        ),
      }
    case Actions.UPDATE_E164_PHONE_NUMBER_SALT:
      return {
        ...state,
        e164NumberToSalt: { ...state.e164NumberToSalt, ...action.e164NumberToSalt },
      }
    case Actions.UPDATE_KNOWN_ADDRESSES:
      return {
        ...state,
        addressToDisplayName: {
          ...state.addressToDisplayName,
          ...action.knownAddresses,
        },
      }
    case Actions.IMPORT_CONTACTS:
      return {
        ...state,
        askedContactsPermission: true,
        importContactsProgress: { status: ImportContactsStatus.Prepping, current: 0, total: 0 },
      }
    case Actions.UPDATE_IMPORT_CONTACT_PROGRESS:
      const curProgress = state.importContactsProgress
      return {
        ...state,
        importContactsProgress: {
          current: action.current ?? curProgress.current,
          total: action.total ?? curProgress.total,
          status: action.status ?? curProgress.status,
        },
      }
    case Actions.END_IMPORT_CONTACTS:
      const { success } = action
      return {
        ...state,
        importContactsProgress: {
          ...state.importContactsProgress,
          status: success ? ImportContactsStatus.Done : ImportContactsStatus.Failed,
        },
      }
    case Actions.DENY_IMPORT_CONTACTS:
      return {
        ...state,
        askedContactsPermission: true,
      }
    case Actions.ADD_CONTACT_MATCHES:
      const matchedContacts = { ...state.matchedContacts, ...action.matches }
      return {
        ...state,
        matchedContacts,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS:
      return {
        ...state,
        // Overwrite the previous mapping when a new address is validated
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}`,
          {
            address: action.validatedAddress,
            addressValidationType: AddressValidationType.NONE,
            validationSuccessful: true,
          }
        ),
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_RESET:
      return {
        ...state,
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}.validationSuccessful`,
          false
        ),
      }
    case Actions.REQUIRE_SECURE_SEND:
      return {
        ...state,
        // Erase the previous mapping when new validation is required
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}`,
          {
            address: undefined,
            addressValidationType: action.addressValidationType,
          }
        ),
      }
    case Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS:
      return {
        ...state,
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}.isFetchingAddresses`,
          true
        ),
      }
    case Actions.END_FETCHING_ADDRESSES:
      return {
        ...state,
        secureSendPhoneNumberMapping: dotProp.merge(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}`,
          { isFetchingAddresses: false, lastFetchSuccessful: action.lastFetchSuccessful }
        ),
      }
    case Actions.UPDATE_ADDRESS_DEK_MAP:
      return {
        ...state,
        addressToDataEncryptionKey: dotProp.set(
          state.addressToDataEncryptionKey,
          action.address,
          action.dataEncryptionKey
        ),
      }
    case AccountActions.CLEAR_STORED_ACCOUNT:
      return {
        ...initialState,
        addressToE164Number: state.addressToE164Number,
        e164NumberToAddress: state.e164NumberToAddress,
        e164NumberToSalt: state.e164NumberToSalt,
        matchedContacts: state.matchedContacts,
        secureSendPhoneNumberMapping: state.secureSendPhoneNumberMapping,
      }
    default:
      return state
  }
}

export const e164NumberToAddressSelector = (state: RootState) => state.identity.e164NumberToAddress
export const addressToE164NumberSelector = (state: RootState) => state.identity.addressToE164Number
export const walletToAccountAddressSelector = (state: RootState) =>
  state.identity.walletToAccountAddress
export const addressToDataEncryptionKeySelector = (state: RootState) =>
  state.identity.addressToDataEncryptionKey
export const e164NumberToSaltSelector = (state: RootState) => state.identity.e164NumberToSalt
export const secureSendPhoneNumberMappingSelector = (state: RootState) =>
  state.identity.secureSendPhoneNumberMapping
export const importContactsProgressSelector = (state: RootState) =>
  state.identity.importContactsProgress
export const matchedContactsSelector = (state: RootState) => state.identity.matchedContacts
export const addressToDisplayNameSelector = (state: RootState) =>
  state.identity.addressToDisplayName

export const providerAddressesSelector = ({ identity: { addressToDisplayName } }: RootState) => {
  return Object.entries(addressToDisplayName)
    .filter(([_, info]) => info?.isProviderAddress)
    .map(([address, _]) => address)
}

export const identifierToE164NumberSelector = createSelector(
  e164NumberToSaltSelector,
  (e164NumberToSalt) => {
    const identifierToE164Numbers: IdentifierToE164NumberType = {}
    for (const e164Number of Object.keys(e164NumberToSalt)) {
      const pepper = e164NumberToSalt[e164Number]
      if (pepper) {
        const phoneHash = getPhoneHash(e164Number, pepper)
        identifierToE164Numbers[phoneHash] = e164Number
      }
    }
    return identifierToE164Numbers
  }
)
