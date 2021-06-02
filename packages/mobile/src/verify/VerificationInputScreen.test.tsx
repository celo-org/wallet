import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

// TODO: Add better tests for this
describe('VerificationInputScreen', () => {
  const store = createMockStore({
    verify: {
      attestationCodes: [],
      status: {
        isVerified: false,
        numAttestationsRemaining: 3,
        total: 3,
        completed: 0,
      },
    },
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationInputScreen {...getMockStackScreenProps(Screens.VerificationInputScreen)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
