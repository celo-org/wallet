import colors from '@celo/react-components/styles/colors'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native'
import { InAppBrowser as BroswerPackage } from 'react-native-inappbrowser-reborn'
import WebView, { WebViewRef } from 'src/components/WebView'
import { navigateBack } from 'src/navigator/NavigationService'

type Props = {
  uri: string
  onCancel?: () => void
}

enum BrowserStatuses {
  loading = 'loading',
  available = 'available',
  unavailable = 'unavailable',
}

function InAppBrowser({ uri, onCancel }: Props) {
  const [browserStatus, setBrowserStatus] = useState<BrowserStatuses>(BrowserStatuses.loading)
  const webview = useRef<WebViewRef>(null)

  const onAndroidBackPress = (): boolean => {
    if (webview.current) {
      webview.current.goBack()
      return true
    }
    return false
  }

  useEffect((): (() => void) => {
    BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress)
    return (): void => {
      BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress)
    }
  }, [])

  useEffect(() => {
    const isBrowserAvailable = async () => {
      setBrowserStatus(
        (await BroswerPackage.isAvailable())
          ? BrowserStatuses.available
          : BrowserStatuses.unavailable
      )
    }

    isBrowserAvailable()
  }, [])

  useEffect(() => {
    const openBrowser = async () => {
      const finalEvent = await BroswerPackage.open(uri, {
        modalEnabled: true,
        modalPresentationStyle: 'fullScreen',
      })

      if (finalEvent.type === 'cancel') {
        onCancel ? onCancel() : navigateBack()
      }
    }

    if (browserStatus === BrowserStatuses.available) {
      openBrowser()
    }
  }, [browserStatus])

  return (
    <>
      {browserStatus === BrowserStatuses.available && null}
      {browserStatus !== BrowserStatuses.available && (
        <View style={styles.container}>
          {browserStatus === BrowserStatuses.loading && (
            <ActivityIndicator size="large" color={colors.greenBrand} />
          )}
          {browserStatus === BrowserStatuses.unavailable && (
            <WebView source={{ uri }} ref={webview} />
          )}
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
})

export default InAppBrowser
