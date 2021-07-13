import LogRocket from '@logrocket/react-native'
import Logger from 'src/utils/Logger'

const TAG = 'logrocket/LogRocket'

export const LOGROCKET_ENABLED = true

// TODO: create project for mainnet before shipping
// https://app.logrocket.com/09u6fq/alfajores-dev/settings/setup/
const LOGROCKET_URL = '09u6fq/alfajores-dev'

export function init() {
  if (!LOGROCKET_URL) {
    Logger.info(TAG, 'LogRocket URL not found, skiping instalation')
    return
  }
  LogRocket.init(LOGROCKET_URL)
  Logger.info(TAG, 'LogRocket installation complete')
}
