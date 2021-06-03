// This file exists for two purposes:
// 1. Ensure that both ios and android files present identical types to importers.
// 2. Allow consumers to import the module as if typescript understood react-native suffixes.

import DefaultAndroid, * as android from './permissions.android'
import DefaultIos, * as ios from './permissions.ios'

// eslint-disable-next-line no-var
declare var _test: typeof ios
// eslint-disable-next-line no-var
declare var _test: typeof android

// eslint-disable-next-line no-var
declare var _testDefault: typeof DefaultIos
// eslint-disable-next-line no-var
declare var _testDefault: typeof DefaultAndroid

export * from './permissions.ios'
