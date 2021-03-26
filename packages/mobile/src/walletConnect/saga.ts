import { EncodedTransaction } from '@celo/connect'
import { UnlockableWallet } from '@celo/wallet-base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { networkId } from 'src/config'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  DenyRequest,
  DenySession,
  initialiseClient as initialiseClientAction,
  InitialisePairing,
  initialisePairing as initialisePairingAction,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  SessionProposal,
  sessionProposal,
  sessionUpdated,
} from 'src/walletConnect/actions'
import { SupportedActions } from 'src/walletConnect/constants'
import { getWallet } from 'src/web3/contracts'
import { getAccountAddress, unlockAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'WalletConnect/saga'

let client: WalletConnectClient | null = null

export function* acceptSession({ session }: AcceptSession) {
  try {
    if (!client) {
      throw new Error('missing client')
    }

    const account: string = yield call(getAccountAddress)
    const response: SessionTypes.Response = {
      metadata: {
        name: 'Valora',
        description: 'A mobile payments wallet that works worldwide',
        url: 'https://valoraapp.com',
        icons: ['https://valoraapp.com/favicon.ico'],
      },
      state: {
        accounts: [`${account}@celo:${networkId}`],
      },
    }

    yield call(client.approve.bind(client), { proposal: session, response })
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', 'missing client')
  }
}

export function* denySession({ session }: DenySession) {
  if (!client) {
    Logger.debug(TAG + '@denySession', 'missing client')
    return
  }
  yield call(client.reject.bind(client), { reason: 'Session denied by user', proposal: session })
}

export function* closeSession({ session }: CloseSession) {
  if (!client) {
    Logger.debug(TAG + '@initialiseClient', 'missing client')
    return
  }

  yield call(client.disconnect.bind(client), {
    topic: session.topic,
    reason: 'Closed by user',
  })
}

export function* acceptRequest({
  request: {
    request: { id, jsonrpc, method, params },
    topic,
  },
}: AcceptRequest) {
  try {
    if (!client) {
      throw new Error('Missing client')
    }

    const account: string = yield select(currentAccountSelector)
    const wallet: UnlockableWallet = yield call(getWallet)

    let result: any

    if (method === SupportedActions.eth_signTransaction) {
      yield call(unlockAccount, account)
      result = (yield call(wallet.signTransaction.bind(wallet), params)) as EncodedTransaction
    } else {
      throw new Error('Unsupported action')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        result,
      },
    })
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
  } finally {
    navigateBack()
  }
}

export function* denyRequest({
  request: {
    request: { id, jsonrpc },
    topic,
  },
}: DenyRequest) {
  try {
    if (!client) {
      throw new Error('Missing client')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        error: {
          code: -32000,
          reason: 'Rejected request',
        },
      },
    })
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', 'missing client')
  } finally {
    navigateBack()
  }
}

export function* watchWalletConnectChannel() {
  const walletConnectChannel: EventChannel<any> = yield call(createWalletConnectChannel)
  while (true) {
    const message: any = yield take(walletConnectChannel)
    yield put(message)
  }
}

export function* createWalletConnectChannel() {
  Logger.debug(TAG + '@initialiseClient', `init start`)
  client = yield call(WalletConnectClient.init, {
    relayProvider: 'wss://relay.walletconnect.org',
    storageOptions: {
      asyncStorage: AsyncStorage,
    },
    logger: 'error',
    controller: true,
  })
  Logger.debug(TAG + '@initialiseClient', `init end`)
  yield put(clientInitialised())

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SessionTypes.Proposal) => emit(sessionProposal(session))
    const onSessionCreated = (session: SessionTypes.Created) => emit(sessionCreated(session))
    const onSessionUpdated = (session: SessionTypes.UpdateParams) => emit(sessionUpdated(session))
    const onSessionDeleted = (session: SessionTypes.DeleteParams) => emit(sessionDeleted(session))
    const onSessionRequest = (request: SessionTypes.RequestEvent) => emit(sessionPayload(request))

    const onPairingProposal = (pairing: PairingTypes.ProposeParams) =>
      emit(pairingProposal(pairing))
    const onPairingCreated = (pairing: PairingTypes.CreateParams) => emit(pairingCreated(pairing))
    const onPairingUpdated = (pairing: PairingTypes.UpdateParams) => emit(pairingUpdated(pairing))
    const onPairingDeleted = (pairing: PairingTypes.DeleteParams) => emit(pairingDeleted(pairing))

    if (!client) {
      Logger.debug(TAG + '@initialiseClient', 'missing client')
      return () => {}
    }

    client.on(CLIENT_EVENTS.session.proposal, onSessionProposal)
    client.on(CLIENT_EVENTS.session.created, onSessionCreated)
    client.on(CLIENT_EVENTS.session.updated, onSessionUpdated)
    client.on(CLIENT_EVENTS.session.deleted, onSessionDeleted)
    client.on(CLIENT_EVENTS.session.request, onSessionRequest)

    client.on(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
    client.on(CLIENT_EVENTS.pairing.created, onPairingCreated)
    client.on(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
    client.on(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

    return () => {
      if (!client) {
        Logger.debug(TAG + '@initialiseClient', 'missing client')
        return
      }

      client.off(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.off(CLIENT_EVENTS.session.created, onSessionCreated)
      client.off(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.off(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.off(CLIENT_EVENTS.session.request, onSessionRequest)

      client.off(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
      client.off(CLIENT_EVENTS.pairing.created, onPairingCreated)
      client.off(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
      client.off(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

      client.session.topics.map((topic) => client!.disconnect({ reason: 'End of session', topic }))
      client.pairing.topics.map((topic) =>
        client!.pairing.delete({ topic, reason: 'End of session' })
      )
      client = null
    }
  })
}

export function navigateToActionRequest({ request }: SessionPayload) {
  navigate(Screens.WalletConnectActionRequest, { request })
}
export function navigateToSessionRequest({ session }: SessionProposal) {
  navigate(Screens.WalletConnectSessionRequest, { session })
}

export function* initialisePairing({ uri }: InitialisePairing) {
  if (!client) {
    Logger.warn(TAG + '@initialisePairing', `missing client`)
    return
  }

  Logger.debug(TAG + '@initialisePairing', `pair start`)
  yield call(client.pair.bind(client), { uri })
  Logger.debug(TAG + '@initialisePairing', `pair end`)
}

export function* walletConnectSaga() {
  yield takeLeading(Actions.INITIALISE_CLIENT, watchWalletConnectChannel)
  yield takeEvery(Actions.INITIALISE_PAIRING, initialisePairing)

  yield takeEvery(Actions.ACCEPT_SESSION, acceptSession)
  yield takeEvery(Actions.DENY_SESSION, denySession)
  yield takeEvery(Actions.CLOSE_SESSION, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PROPOSAL, navigateToSessionRequest)
  yield takeEvery(Actions.SESSION_PAYLOAD, navigateToActionRequest)
}

export function* initialiseWalletConnect(uri: string) {
  if (!client) {
    yield put(initialiseClientAction())
    yield take(Actions.CLIENT_INITIALISED)
  } else {
    client.session.values.map((s) => client?.disconnect({ topic: s.topic, reason: 'Restart' }))
    client.pairing.values.map((p) => client?.pairing.delete({ topic: p.topic, reason: 'Restart' }))
  }
  yield put(initialisePairingAction(uri))
}
