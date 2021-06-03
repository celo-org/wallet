import SmsRetriever from '@celo/react-native-sms-retriever'
import { Platform } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, put, take } from 'redux-saga/effects'
import Logger from 'src/utils/Logger'
import { CodeInputType, NUM_ATTESTATIONS_REQUIRED, receiveAttestationCode } from 'src/verify/module'

const TAG = 'identity/smsRetrieval'

interface SmsEvent {
  error?: string
  timeout?: string
  message?: string
}

export function* startAutoSmsRetrieval() {
  if (Platform.OS !== 'android') {
    return
  }
  const autoSmsChannel = eventChannel((emitter) => {
    addSmsListener(emitter)
    return removeSmsListener
  })
  yield call(startSmsRetriever)
  try {
    const messages: string[] = []
    while (true) {
      const { message } = yield take(autoSmsChannel)
      if (!messages.includes(message)) {
        messages.push(message)
        yield put(receiveAttestationCode({ message, inputType: CodeInputType.AUTOMATIC }))
      }
    }
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error while retrieving code', error)
  } finally {
    autoSmsChannel.close()
  }
}

async function startSmsRetriever() {
  if (Platform.OS !== 'android') {
    return
  }
  Logger.debug(TAG + '@SmsRetriever', 'Starting sms retriever')
  try {
    // TODO(Rossy) Remove the *2 here once the SmsRetriever can filter dupes on its own
    const result = await SmsRetriever.startSmsRetriever(NUM_ATTESTATIONS_REQUIRED * 2)
    if (result) {
      Logger.debug(TAG + '@SmsRetriever', 'Retriever started successfully')
    } else {
      Logger.error(TAG + '@SmsRetriever', 'Start retriever reported failure')
    }
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error starting retriever', error)
  }
}

function addSmsListener(onSmsRetrieved: (message: SmsEvent) => void) {
  if (Platform.OS !== 'android') {
    return
  }
  Logger.debug(TAG + '@SmsRetriever', 'Adding sms listener')
  try {
    SmsRetriever.addSmsListener((event: SmsEvent) => {
      if (!event) {
        Logger.error(TAG + '@SmsRetriever', 'Sms listener event is null')
        return
      }
      if (event.error) {
        Logger.error(TAG + '@SmsRetriever', 'Sms listener error: ' + event.error)
        return
      }
      if (event.timeout) {
        Logger.warn(TAG + '@SmsRetriever', 'Sms listener timed out')
        return
      }
      if (!event.message) {
        Logger.warn(TAG + '@SmsRetriever', 'Sms listener returned empty message')
        return
      }

      Logger.debug(TAG + '@SmsRetriever', 'Message Received from sms listener', event.message)
      onSmsRetrieved(event)
    })
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error adding sms listener', error)
  }
}

function removeSmsListener() {
  if (Platform.OS !== 'android') {
    return
  }
  try {
    Logger.debug(TAG + '@SmsRetriever', 'Removing sms listener')
    SmsRetriever.removeSmsListener()
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error removing sms listener', error)
  }
}
