import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { CodeInputStatus } from 'src/components/CodeInput'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'
import { createMockStore } from 'test/utils'
import { mockAttestationMessage } from 'test/values'

// TODO: Add better tests for this
describe('VerificationCodeInput', () => {
  const store = createMockStore({
    verify: {
      attestationCodes: [
        { code: 'longCode', shortCode: '1', issuer: '10' },
        { code: 'longCode2', shortCode: '2', issuer: '20' },
      ],
      acceptedAttestationCodes: [{ code: 'longCode', shortCode: '1', issuer: '10' }],
      attestationInputStatus: [
        CodeInputStatus.Accepted,
        CodeInputStatus.Processing,
        CodeInputStatus.Inputting,
      ],
    },
  })

  function renderInput() {
    return render(
      <Provider store={store}>
        <VerificationCodeInput
          shortVerificationCodesEnabled={false}
          label="Test label"
          index={0}
          inputValue={mockAttestationMessage.code}
          inputPlaceholder="Test placeholder"
          inputPlaceholderWithClipboardContent="Test clipboard"
          onInputChange={jest.fn()}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const { toJSON } = renderInput()
    expect(toJSON()).toMatchSnapshot()
  })
})
