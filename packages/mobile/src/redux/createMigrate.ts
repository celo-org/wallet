// Adapted from https://github.com/rt2zz/redux-persist/blob/d7efde9115a0bd2d6a0309ac6fb1c018bf06dc30/src/createMigrate.js
// so we can enable logging in production
import * as Sentry from '@sentry/react-native'
import type { MigrationManifest, PersistedState } from 'redux-persist'
import { DEFAULT_VERSION } from 'redux-persist/es/constants'
import Logger from 'src/utils/Logger'

const TAG = 'redux/migrate'

export default function createMigrate(migrations: MigrationManifest) {
  return function (state: PersistedState, currentVersion: number): Promise<PersistedState> {
    if (!state) {
      Logger.info(TAG, 'no inbound state, skipping migration')
      return Promise.resolve(undefined)
    }

    let inboundVersion: number =
      state._persist && state._persist.version !== undefined
        ? state._persist.version
        : DEFAULT_VERSION
    if (inboundVersion === currentVersion) {
      Logger.info(TAG, 'versions match, noop migration')
      return Promise.resolve(state)
    }
    if (inboundVersion > currentVersion) {
      Logger.error(TAG, 'downgrading version is not supported')
      return Promise.resolve(state)
    }

    let migrationKeys = Object.keys(migrations)
      .map((ver) => parseInt(ver))
      .filter((key) => currentVersion >= key && key > inboundVersion)
      .sort((a, b) => a - b)

    Logger.info(TAG, 'migrationKeys', migrationKeys)
    try {
      let migratedState = migrationKeys.reduce<PersistedState>((state, versionKey) => {
        Logger.info(TAG, 'running migration for versionKey', versionKey)
        return migrations[versionKey](state)
      }, state)
      return Promise.resolve(migratedState)
    } catch (err) {
      Sentry.captureException(err)
      Logger.error(TAG, 'Failed to migrate state', err)
      return Promise.reject(err)
    }
  }
}
