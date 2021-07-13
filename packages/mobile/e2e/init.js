const detox = require('detox')
import { setDemoMode } from './src/utils/utils'
import { launchApp } from './src/utils/retries'

beforeAll(async () => {
  // Install app if not present
  await device.installApp()
  await launchApp({
    newInstance: false,
    permissions: { notifications: 'YES', contacts: 'YES' },
  })
  // Url blacklist disables detox waiting for this request to complete before considering the app in an idle state
  await device.setURLBlacklist(['.*blockchain-api-dot-celo-mobile-alfajores.appspot.com.*'])
  await setDemoMode()
})
