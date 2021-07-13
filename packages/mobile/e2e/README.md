# End-to-End tests

[![e2e test status](https://storage.googleapis.com/celo-e2e-data/e2e-banner.svg)](https://console.cloud.google.com/storage/browser/celo-e2e-data?project=celo-testnet)

These are the End-to-End (e2e) tests for the wallet mobile app. They run an emulator and simulate a user clicking through the app.

## Setting up the VM

### Android

First install the emulator as described in the [mobile readme](../README.md#optional-install-an-android-emulator).

By default, the e2e scripts will assume the VM name of `Pixel_API_29_AOSP_x86_64` recommended in the instructions but you can rename the VM as you like.

Next, to improve reliability of the tests, configure the VM as described in the [Detox best practices doc](https://github.com/wix/Detox/blob/master/docs/Introduction.AndroidEmulatorsBestPractices.md).

### iOS

Ensure you have Xcode installed.

Install [AppleSimulatorUtils](https://github.com/wix/AppleSimulatorUtils#installing) which is used in e2e scripts to launch the iOS simulator.

## Running the tests

Simply run `yarn test:e2e:android` or `yarn test:e2e:ios`

The run_e2e.sh script will take care of configuring and building the app for you.


## e2e tests in Detox

For most e2e tests you need to do three things:

- Find elements using `element(by.id('SomeTestID'))`: Give the element you want to find a testID so they can be reliably found on the screen
- Perform actions on the element, such as `element.tap()` or `element.typeText('Some Text ')`. Detox will automatically wait for these actions to finish.
- Test properties of the element using expectations, such as `expect(element).toBeVisible()`. You will mostly need `.toBeVisible()` and `.toHaveText()`.

```javascript
it('has a button to select the language', async () => {
  await element(by.id('ChooseLanguage/en-US')).tap()
  await element(by.id('ChooseLanguageButton')).tap()
  await expect(element(by.id(`ButtonSkipToInvite`))).toBeVisible()
})
```

Detox will now look for an element with the testID 'ChooseLanguage/en-US' and then tap on it. Detox will automatically wait for the app to react to the action. Since we are performing an action with this test, this is an 'actions' test.
After english was selected, detox will tap the button to submit our language of choice. Detox will now wait until the next screen (the sync screen). On that screen is a button to skip to the Invite screen, and the last line checks that the button is there. If the button is there, we know that pressing the 'ChooseLanguageButton' worked.

The function needs to be `async`, and you will need to `await` all calls to detox functions.

For more information about Detox, check out the [API reference](https://github.com/wix/Detox/blob/master/docs/README.md#api-reference)

## Adding a test

The main test files are on the root of the e2e/src directory. Test suites call the specific use cases, which live in the [usecases](./src/usecases) directory.

In the [usecases](./src/usecases) directory, create new `<usecase>.js` or add an it-block to an existing appropriate use case.

If creating a suite of tests, add a new `<TestSuiteName>.spec.js` file following the format of [AccountSupport.spec.js](./src/AccountSupport.spec.js).

While developing and adding new tests, it's useful to run only the ones we are working on and not go through the onboarding on each run. To do this, use the following strategy:

- For the first test run `yarn test:e2e:ios -w 1 -t \<Test Name>.spec.js$` this will install the application on your device and run the targeted test suite.

- For subsequent test runs run `yarn test:e2e:ios -d -w 1 -f \<Test Name>.spec.js$ -t Display Providers`. The `-d` flag will prevent the app from reinstalling and reuse the previous install and will not restart the packager. The `-w` flag will specify how many emulators to run in parallel. The `-f` flag will run matching test files. The `-t` flag will run only tests with matching regex patterns; the regex is matched against the full name, which is a combination of the test name and all its surrounding describe blocks.

Use a similar process to run and develop other test files.

### Example

```JavaScript
// Sample <TestSuiteName>.spec.js setup
import { quickOnboarding, getDeviceModel } from './utils/utils'
import { reloadReactNative } from '../utils/retries'

import AddedUsecase from './usecases/AddedUsecase'

describe('A New Test Suite', () => {
  beforeAll(async () => {
    // Restores the test account if needed
    await quickOnboarding()
  })

  describe('A New Usecase', AddedUsecase)
})
```

```JavaScript
// Sample <UseCase>.js
export default AddedUsecase = () => {
  beforeEach(async () => {
    // Reload app on device
    await reloadReactNative()

    // Dismiss banners if interfering with next steps
    await dismissBanners()

    // Example setup steps for every test spec in this usecase
    await element(by.id('Hamburger')).tap()
    await element(by.id('add-and-withdraw')).tap()
    await element(by.id('addFunds')).tap()
  })
  
  // Sample test spec / it block
  it('Display Providers', async () => {
    // Test spec specific steps
    await element(by.id('GoToProviderButton')).tap()
    await element(by.id('FiatExchangeInput')).replaceText('$50')
    await element(by.id('FiatExchangeNextButton')).tap()

    // Assertions - check that all providers are visible
    await expect(element(by.id('Provider/Moonpay'))).toBeVisible()
    await expect(element(by.id('Provider/Simplex'))).toBeVisible()
    await expect(element(by.id('Provider/Xanpool'))).toBeVisible()
    await expect(element(by.id('Provider/Ramp'))).toBeVisible()
    await expect(element(by.id('Provider/Transak'))).toBeVisible()
    await sleep(5000)

    // Compare to screenshot in `e2e/assets`
    const imagePath = await device.takeScreenshot('All Providers')
    await pixelDiff(imagePath, `./e2e/assets/${await getDeviceModel()}/All Providers.png`)
  })

  it('Additional Test Spec...', async () => {
    // Additional test spec starting after 'addFunds' tap
  })
}
```

### Recording a test
On macOS it is possible to record a test using [Detox Recorder](https://github.com/wix/DetoxRecorder).

1. Run the app with `yarn dev:ios` from `wallet/packages/mobile`.

2. Navigate to the root directory `wallet`.

3. Run the Detox Recorder.

```sh
# Running Detox Recorder from the wallet directory
detox recorder --bundleId "org.celo.mobile.alfajores.dev" --simulatorId booted --outputTestFile "~/Desktop/RecordedTest.js" --testName "My Recorded Test" --record
```

4. Use the it-block in the recorded test as a starting point for the new e2e test. Add assertions where appropriate and structure it like existing tests in [usecases](./src/usecases) directory.

## Adding TestIDs

A TestID is a unique string that you should give to the components you want to test. The build-in components from react native support adding testIDs like this:

```jsx
<button testID='SubmitButtonOnPaymentScreen'>
```

You should make your testIDs unique by describing the purpose of the element with reference to the screen it is on.

### Adding TestIDs to custom components

Usually, you will want to pass the testID as a prop from your custom component to some child component. Sometimes is makes sense to automatically generate the testID based on existing props. If you need to identify multiple child components, you should generate their testID from the testID of your custom component, for example:

```jsx
class ExampleInput extends React.Component {
  render() {
    return (
      <View testID={this.props.testID}>
        <Field testID={`${this.props.testID}/InputField`} />
        <Button testID={`${this.props.testID}/SubmitButton`} />
      </View>
    )
  }
}
```

It is recommended to follow the scheme parentID/ChildDescription.

## Mocks for the e2e tests

The e2e tests should use as few mocks as possible, since they are supposed to be as close to the real app as possible. They don't change in between tests. All e2e test use the same build as the app, but sometimes it is necessary to mock a module.

The mocks are only used when the environment variable `CELO_TEST_CONFIG` is set too 'e2e'. This variable will be read in `mobile/rn-cli.config.js` and will modify what the metro bundler will include in the bundle. If you're mocking a module from node_nodules, put the mock in `e2e/mocks/`. Use the file extension `.e2e.ts` or `.e2e.js`.

## The e2e banner

In the readme files (in the root, mobile, and this one), there are banners for the e2e tests. The test status is saved in a [google cloud storage bucket](https://console.cloud.google.com/storage/browser/celo-e2e-data?project=celo-testnet).
There is also a log file for the last test run.

Too see all the versions of the log file:

```bash
gsutil ls -al  gs://celo-e2e-data/last_run_log
```

Too display a specific version of the log file:

```bash
gsutil cat  gs://celo-e2e-data/last_run_log#<version_number>
gsutil cat  gs://celo-e2e-data/last_run_log   #specify no version number to get the latest
```

If you need to have a more detailed look, there is a collection of log files and even screenshots for the failing tests saved in `detailed_logs.tar.gz`. Download with:

```bash
  gsutil cp gs://celo-e2e-data/detailed_logs.tar.gz .
  tar -xvf detailed_logs.tar.gz
```

These files are uploaded by by the [a script](../scripts/ci-e2e.sh), that is executed regularly. Don't use this script to run the tests locally.

## Troubleshooting

If tests are failing for unknown reasons:

- Rebuild, re-yarn and rerun. Sometimes the problem just goes away.
- Delete snapshots in the emulator
- Look at the emulator while the tests are running. Can you see anything obvious going wrong?

### Sample `.zshrc` & `.bashrc`
```sh
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export GEM_HOME="$HOME/.gem"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_NDK="$HOME/Library/Android/sdk/ndk"
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export GRADLE_OPTS='-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.jvmargs="-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError"'
export ANDROID_AVD_HOME="$HOME/.android/avd"
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$PATH

# nvm things: use `setopt interactivecomments` in your terminal to allow comments in the .zshrc 
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```