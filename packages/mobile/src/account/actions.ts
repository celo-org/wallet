import { DailyLimitRequestStatus, PincodeType } from 'src/account/reducer'

export enum Actions {
  CHOOSE_CREATE_ACCOUNT = 'ACCOUNT/CHOOSE_CREATE',
  CHOOSE_RESTORE_ACCOUNT = 'ACCOUNT/CHOOSE_RESTORE',
  START_STORE_WIPE_RECOVERY = 'ACCOUNT/START_STORE_WIPE_RECOVERY',
  CANCEL_CREATE_OR_RESTORE_ACCOUNT = 'ACCOUNT/CANCEL_CREATE_OR_RESTORE_ACCOUNT',
  SET_NAME = 'ACCOUNT/SET_NAME',
  SET_PHONE_NUMBER = 'ACCOUNT/SET_PHONE_NUMBER',
  SET_PICTURE = 'ACCOUNT/SET_PICTURE',
  SAVE_NAME_AND_PICTURE = 'ACCOUNT/SAVE_NAME_AND_PICTURE',
  DEV_MODE_TRIGGER_CLICKED = 'ACCOUNT/NAME_CLICKED',
  PHOTOSNUX_CLICKED = 'ACCOUNT/PHOTOSNUX_CLICKED',
  SET_PINCODE = 'ACCOUNT/SET_PINCODE',
  SET_PINCODE_SUCCESS = 'ACCOUNT/SET_PINCODE_SUCCESS',
  SET_PINCODE_FAILURE = 'ACCOUNT/SET_PINCODE_FAILURE',
  SET_ACCOUNT_CREATION_TIME = 'ACCOUNT/SET_ACCOUNT_CREATION_TIME',
  INITIALIZE_ACCOUNT = 'ACCOUNT/INITIALIZE_ACCOUNT',
  INITIALIZE_ACCOUNT_SUCCESS = 'ACCOUNT/INITIALIZE_ACCOUNT_SUCCESS',
  INITIALIZE_ACCOUNT_FAILURE = 'ACCOUNT/INITIALIZE_ACCOUNT_FAILURE',
  SET_BACKUP_COMPLETED = 'ACCOUNT/SET_BACKUP_COMPLETED',
  SET_BACKUP_DELAYED = 'ACCOUNT/SET_BACKUP_DELAYED',
  TOGGLE_BACKUP_STATE = 'ACCOUNT/TOGGLE_BACKUP_STATE',
  DISMISS_INVITE_FRIENDS = 'ACCOUNT/DISMISS_INVITE_FRIENDS',
  DISMISS_GET_VERIFIED = 'ACCOUNT/DISMISS_GET_VERIFIED',
  DISMISS_GOLD_EDUCATION = 'ACCOUNT/DISMISS_GOLD_EDUCATION',
  SET_USER_CONTACT_DETAILS = 'ACCOUNT/SET_USER_CONTACT_DETAILS',
  SET_PROMPT_FORNO = 'ACCOUNT/SET_PROMPT_FORNO',
  SET_RETRY_VERIFICATION_WITH_FORNO = 'ACCOUNT/SET_RETRY_VERIFICATION_WITH_FORNO',
  ACCEPT_TERMS = 'ACCOUNT/ACCEPT_TERMS',
  CLEAR_STORED_ACCOUNT = 'ACCOUNT/CLEAR_STORED_ACCOUNT',
  PROFILE_UPLOADED = 'ACCOUNT/PROFILE_UPLOADED',
  UPDATE_DAILY_LIMIT = 'ACCOUNT/UPDATE_DAILY_LIMIT',
  UPDATE_DAILY_LIMIT_REQUEST_STATUS = 'ACCOUNT/UPDATE_DAILY_LIMIT_REQUEST_STATUS',
}

export interface ChooseCreateAccountAction {
  type: Actions.CHOOSE_CREATE_ACCOUNT
}
export interface ChooseRestoreAccountAction {
  type: Actions.CHOOSE_RESTORE_ACCOUNT
}

export interface StartStoreWipeRecoveryAction {
  type: Actions.START_STORE_WIPE_RECOVERY
  accountToRecover: string
}

export interface CancelCreateOrRestoreAccountAction {
  type: Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT
}

export interface SetNameAction {
  type: Actions.SET_NAME
  name: string
}

export interface SetPhoneNumberAction {
  type: Actions.SET_PHONE_NUMBER
  e164PhoneNumber: string
  countryCode: string
}

export interface SetPictureAction {
  type: Actions.SET_PICTURE
  pictureUri: string | null
}

export interface SaveNameAndPictureAction {
  type: Actions.SAVE_NAME_AND_PICTURE
  name: string
  pictureUri: string | null
}

export interface DevModeTriggerClickedAction {
  type: Actions.DEV_MODE_TRIGGER_CLICKED
}

export interface AcceptTermsAction {
  type: Actions.ACCEPT_TERMS
}

export interface PhotosNUXClickedAction {
  type: Actions.PHOTOSNUX_CLICKED
}

export interface SetPincodeAction {
  type: Actions.SET_PINCODE
  pincodeType: PincodeType
}

export interface SetPincodeSuccessAction {
  type: Actions.SET_PINCODE_SUCCESS
  pincodeType: PincodeType
}

export interface SetPincodeFailureAction {
  type: Actions.SET_PINCODE_FAILURE
}

export interface InitializeAccountAction {
  type: Actions.INITIALIZE_ACCOUNT
}

export interface InitializeAccountSuccessAction {
  type: Actions.INITIALIZE_ACCOUNT_SUCCESS
}

export interface InitializeAccountFailureAction {
  type: Actions.INITIALIZE_ACCOUNT_FAILURE
}

export interface SetAccountCreationAction {
  type: Actions.SET_ACCOUNT_CREATION_TIME
  now: number
}

export interface SetBackupCompletedAction {
  type: Actions.SET_BACKUP_COMPLETED
}

export interface SetBackupDelayedAction {
  type: Actions.SET_BACKUP_DELAYED
  now: number
}

export interface ToggleBackupState {
  type: Actions.TOGGLE_BACKUP_STATE
}

export interface DismissInviteFriendsAction {
  type: Actions.DISMISS_INVITE_FRIENDS
}

export interface DismissGetVerifiedAction {
  type: Actions.DISMISS_GET_VERIFIED
}

export interface DismissGoldEducationAction {
  type: Actions.DISMISS_GOLD_EDUCATION
}

export interface SetContactDetailsAction {
  type: Actions.SET_USER_CONTACT_DETAILS
  contactId: string
  thumbnailPath: string | null
}

interface SetPromptFornoAction {
  type: Actions.SET_PROMPT_FORNO
  promptIfNeeded: boolean
}

export interface SetRetryVerificationWithFornoAction {
  type: Actions.SET_RETRY_VERIFICATION_WITH_FORNO
  retry: boolean
}

export interface ClearStoredAccountAction {
  type: Actions.CLEAR_STORED_ACCOUNT
  account: string
  onlyReduxState: boolean
}

export interface ProfileUploadedAction {
  type: Actions.PROFILE_UPLOADED
}

export interface ProfileUploadedAction {
  type: Actions.PROFILE_UPLOADED
}

export interface UpdateDailyLimitAction {
  type: Actions.UPDATE_DAILY_LIMIT
  newLimit: number
}

export interface UpdateDailyLimitRequestStatusAction {
  type: Actions.UPDATE_DAILY_LIMIT_REQUEST_STATUS
  dailyLimitRequestStatus: DailyLimitRequestStatus
}

export type ActionTypes =
  | ChooseCreateAccountAction
  | ChooseRestoreAccountAction
  | StartStoreWipeRecoveryAction
  | CancelCreateOrRestoreAccountAction
  | SetNameAction
  | SetPhoneNumberAction
  | SetPictureAction
  | SaveNameAndPictureAction
  | DevModeTriggerClickedAction
  | PhotosNUXClickedAction
  | SetPincodeAction
  | SetPincodeSuccessAction
  | SetPincodeFailureAction
  | InitializeAccountAction
  | InitializeAccountSuccessAction
  | InitializeAccountFailureAction
  | SetAccountCreationAction
  | SetBackupCompletedAction
  | SetBackupDelayedAction
  | ToggleBackupState
  | DismissInviteFriendsAction
  | DismissGetVerifiedAction
  | DismissGoldEducationAction
  | SetContactDetailsAction
  | SetPromptFornoAction
  | SetRetryVerificationWithFornoAction
  | AcceptTermsAction
  | ClearStoredAccountAction
  | ProfileUploadedAction
  | UpdateDailyLimitAction
  | UpdateDailyLimitRequestStatusAction

export function chooseCreateAccount(): ChooseCreateAccountAction {
  return {
    type: Actions.CHOOSE_CREATE_ACCOUNT,
  }
}

export function chooseRestoreAccount(): ChooseRestoreAccountAction {
  return {
    type: Actions.CHOOSE_RESTORE_ACCOUNT,
  }
}

export function startStoreWipeRecovery(accountToRecover: string): StartStoreWipeRecoveryAction {
  return {
    type: Actions.START_STORE_WIPE_RECOVERY,
    accountToRecover,
  }
}

export function cancelCreateOrRestoreAccount(): CancelCreateOrRestoreAccountAction {
  return {
    type: Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT,
  }
}

export function setName(name: string): SetNameAction {
  return {
    type: Actions.SET_NAME,
    name,
  }
}

export function acceptTerms(): AcceptTermsAction {
  return {
    type: Actions.ACCEPT_TERMS,
  }
}

export function setPhoneNumber(e164PhoneNumber: string, countryCode: string): SetPhoneNumberAction {
  return {
    type: Actions.SET_PHONE_NUMBER,
    e164PhoneNumber,
    countryCode,
  }
}

export function saveNameAndPicture(
  name: string,
  pictureUri: string | null
): SaveNameAndPictureAction {
  return {
    type: Actions.SAVE_NAME_AND_PICTURE,
    name,
    pictureUri,
  }
}

export function setPicture(pictureUri: string | null): SetPictureAction {
  return {
    type: Actions.SET_PICTURE,
    pictureUri,
  }
}

export const devModeTriggerClicked = (): DevModeTriggerClickedAction => ({
  type: Actions.DEV_MODE_TRIGGER_CLICKED,
})

export const photosNUXCompleted = (): PhotosNUXClickedAction => ({
  type: Actions.PHOTOSNUX_CLICKED,
})

export const setPincode = (pincodeType: PincodeType): SetPincodeAction => ({
  type: Actions.SET_PINCODE,
  pincodeType,
})

export const setPincodeSuccess = (pincodeType: PincodeType): SetPincodeSuccessAction => ({
  type: Actions.SET_PINCODE_SUCCESS,
  pincodeType,
})

export const setPincodeFailure = (): SetPincodeFailureAction => ({
  type: Actions.SET_PINCODE_FAILURE,
})

export const initializeAccount = (): InitializeAccountAction => ({
  type: Actions.INITIALIZE_ACCOUNT,
})

export const initializeAccountSuccess = (): InitializeAccountSuccessAction => ({
  type: Actions.INITIALIZE_ACCOUNT_SUCCESS,
})

export const initializeAccountFailure = (): InitializeAccountFailureAction => ({
  type: Actions.INITIALIZE_ACCOUNT_FAILURE,
})

export const setAccountCreationTime = (now: number): SetAccountCreationAction => ({
  type: Actions.SET_ACCOUNT_CREATION_TIME,
  now,
})

export const setBackupCompleted = (): SetBackupCompletedAction => ({
  type: Actions.SET_BACKUP_COMPLETED,
})

export const setBackupDelayed = (now: number): SetBackupDelayedAction => ({
  type: Actions.SET_BACKUP_DELAYED,
  now,
})

export const toggleBackupState = (): ToggleBackupState => ({
  type: Actions.TOGGLE_BACKUP_STATE,
})

export const dismissInviteFriends = (): DismissInviteFriendsAction => ({
  type: Actions.DISMISS_INVITE_FRIENDS,
})

export const dismissGetVerified = (): DismissGetVerifiedAction => ({
  type: Actions.DISMISS_GET_VERIFIED,
})

export const dismissGoldEducation = (): DismissGoldEducationAction => ({
  type: Actions.DISMISS_GOLD_EDUCATION,
})

export const setPromptForno = (promptIfNeeded: boolean): SetPromptFornoAction => ({
  type: Actions.SET_PROMPT_FORNO,
  promptIfNeeded,
})

export const setRetryVerificationWithForno = (
  retry: boolean
): SetRetryVerificationWithFornoAction => ({
  type: Actions.SET_RETRY_VERIFICATION_WITH_FORNO,
  retry,
})

export const setUserContactDetails = (
  contactId: string,
  thumbnailPath: string | null
): SetContactDetailsAction => ({
  type: Actions.SET_USER_CONTACT_DETAILS,
  contactId,
  thumbnailPath,
})

export const clearStoredAccount = (
  account: string,
  onlyReduxState: boolean = false
): ClearStoredAccountAction => ({
  type: Actions.CLEAR_STORED_ACCOUNT,
  account,
  onlyReduxState,
})

export const profileUploaded = (): ProfileUploadedAction => ({
  type: Actions.PROFILE_UPLOADED,
})

export const updateCusdDailyLimit = (newLimit: number): UpdateDailyLimitAction => ({
  type: Actions.UPDATE_DAILY_LIMIT,
  newLimit,
})

export const updateDailyLimitRequestStatus = (status: DailyLimitRequestStatus) => ({
  type: Actions.UPDATE_DAILY_LIMIT_REQUEST_STATUS,
  dailyLimitRequestStatus: status,
})
