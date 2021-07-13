import { readFileSync } from 'fs'
import { Providers } from './Providers'

// Inputs:
const logFilePath = '/Users/tarik/Downloads/transak_logs.json'
const provider = Providers.Transak

const logs = JSON.parse(readFileSync(logFilePath, 'utf8'))

const project = logs[0].logName.split('/')[1]
process.env.GCLOUD_PROJECT = project
// Using an in-line require because process variables need to be defined
// before calling these functions
const { parseMoonpayEvent } = require('./moonpayWebhook')
const { parseRampEvent } = require('./rampWebhook')
const { parseXanpoolEvent } = require('./xanpoolwebhook')
const { parseTransakEvent } = require('./transakWebhook')

const selectEventParser = (provider: Providers): Function => {
  if (provider === Providers.Moonpay) {
    return parseMoonpayEvent
  }

  if (provider === Providers.Ramp) {
    return parseRampEvent
  }

  if (provider === Providers.Xanpool) {
    return parseXanpoolEvent
  }
  if (provider === Providers.Transak) {
    return parseTransakEvent
  }

  return () => ({})
}

const selectEventTable = (provider: Providers): string => {
  if (provider === Providers.Moonpay) {
    return 'cico_provider_events_moonpay'
  }

  if (provider === Providers.Ramp) {
    return 'cico_provider_events_ramp'
  }

  if (provider === Providers.Xanpool) {
    return 'cico_provider_events_xanpool'
  }

  if (provider === Providers.Transak) {
    return 'cico_provider_events_transak'
  }

  return ''
}

const processLogs = async (provider: Providers) => {
  console.info(`Parsing through ${logs.length} logs`)
  const parser = selectEventParser(provider)
  for (let i = 0; i < logs.length; i += 1) {
    const payload: string = logs[i].textPayload
    if (payload.startsWith('Request body:')) {
      const startIndex = payload.indexOf('{')
      const body = JSON.parse(payload.slice(startIndex))
      await parser(body)
      console.info(`Stored event #${i + 1}`)
    }
  }

  const { deleteDuplicates } = require('../bigQuery')
  const eventTable = selectEventTable(provider)
  await deleteDuplicates(eventTable)
  console.info('DONE!')
}

processLogs(provider).catch((error) => console.error(error))
