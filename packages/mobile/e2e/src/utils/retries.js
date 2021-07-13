import { retry } from 'ts-retry-promise'

export const launchApp = async (
  launchArgs = {
    newInstance: true,
    permissions: { notifications: 'YES', contacts: 'YES' },
    launchArgs: {
      detoxPrintBusyIdleResources: 'YES',
    },
  }
) => {
  await retry(
    async () => {
      try {
        await device.launchApp(launchArgs)
      } catch (error) {
        error.message = `Failed to launch app with error: ${error.message}`
        throw error
      }
    },
    { retries: 5, delay: 10000, timeout: 300000 }
  )
}

export const reloadReactNative = async () => {
  await retry(
    async () => {
      try {
        await device.reloadReactNative()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to reload react native with error', error)
        await launchApp()
      }
    },
    { retries: 5, delay: 10000, timeout: 300000 }
  )
}
