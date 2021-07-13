import { CodeInputStatus } from 'src/components/CodeInput'
import { ImportContactsStatus, VerificationStatus } from 'src/identity/types'
import { assign, Assigner, Machine, PropertyAssigner } from 'xstate'
import { ActionTypes } from './actions'
import { State } from './reducer'

const _assign = (assignment: Assigner<State, ActionTypes> | PropertyAssigner<State, ActionTypes>) =>
  assign<State, ActionTypes>(assignment)

const authMachine = Machine<State, ActionTypes>({
  id: 'auth',

  initial: 'stopped',

  context: {
    attestationCodes: [],
    acceptedAttestationCodes: [],
    attestationInputStatus: [
      CodeInputStatus.Inputting,
      CodeInputStatus.Disabled,
      CodeInputStatus.Disabled,
    ],
    numCompleteAttestations: 0,
    verificationStatus: VerificationStatus.Stopped,
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
    lastRevealAttempt: null,
  },

  states: {
    Stopped: {
      on: {
        'IDENTITY/START_VERIFICATION': {
          target: 'Prepping',
          actions: ['start'],
        },
      },
    },

    Prepping: {},
  },

  actions: {
    start: _assign({}),
  },
})

export default authMachine
