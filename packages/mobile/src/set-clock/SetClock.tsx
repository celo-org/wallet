import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import format from 'date-fns/esm/format'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import { Namespaces, withTranslation } from 'src/i18n'
import { clockIcon } from 'src/images/Images'
import { restartApp } from 'src/utils/AppRestart'
import { getLocalTimezone, getRemoteTime } from 'src/utils/time'

interface State {
  correctTime: number
}

export class SetClock extends React.Component<WithTranslation, State> {
  state = {
    correctTime: Date.now(),
  }

  componentDidMount = async () => {
    const correctTime = await getRemoteTime()
    this.setState({ correctTime })
  }

  goToSettingsOrRestart = () => {
    if (Platform.OS === 'android') {
      return AndroidOpenSettings.dateSettings()
    } else {
      restartApp()
      // With the following line we would be able to direct to the correct screen in
      // settings, but it looks like this is a private API and using it risks getting
      // the app rejected by Apple: https://stackoverflow.com/a/34024467
      // return Linking.openURL('App-prefs:General&path=DATE_AND_TIME')
    }
  }

  render() {
    const { t } = this.props

    return (
      <View style={styles.backgroundContainer}>
        <View style={styles.header}>
          <Image source={clockIcon} style={styles.clockImage} resizeMode="contain" />
          <Text style={[fontStyles.h1, styles.time]} testID="SetClockTitle">
            {format(this.state.correctTime, 'Pp')}
          </Text>
          <Text style={fontStyles.regular} testID="SetClockTitle">
            ({getLocalTimezone()})
          </Text>
        </View>
        <View>
          <Text style={[fontStyles.h1, styles.bodyText]} testID="SetClockTitle">
            {t('yourClockIsBroke')}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Text style={[fontStyles.small, styles.instructions]}>{t('adjustYourClock')}</Text>
          <Button
            onPress={this.goToSettingsOrRestart}
            text={Platform.OS === 'android' ? t('adjustDate') : t('quitApp')}
            type={BtnTypes.PRIMARY}
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  clockImage: {
    height: 75,
    marginBottom: 10,
  },
  time: {
    color: colors.dark,
    paddingBottom: 10,
  },
  bodyText: {
    color: colors.gray5,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  instructions: {
    textAlign: 'center',
    color: colors.dark,
    padding: 20,
  },
})

export default withTranslation<WithTranslation>(Namespaces.global)(SetClock)
