import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Settings from 'src/account/Settings'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

describe('Account', () => {
  const mockedNavigate = navigate as jest.Mock
  const mockedEnsurePincode = ensurePincode as jest.Mock
  // Clear mocks before each test so that navigate is called with fresh copy
  beforeEach(() => {
    jest.clearAllMocks()
    mockedNavigate.mockReset()
  })

  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: mockE164Number,
          },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balance: '0.00' },
          goldToken: { balance: '0.00' },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when dev mode active', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balance: '0.00' },
          goldToken: { balance: '0.00' },
          account: {
            devModeActive: true,
            e164PhoneNumber: mockE164Number,
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly when verification is not possible', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to PincodeSet screen if entered PIN is correct', async () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('ChangePIN'))
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onSuccess()
      expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet, {
        isVerifying: false,
        changePin: true,
      })
    })
  })

  it('does not navigate to PincodeSet screen if entered PIN is incorrect', async () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('ChangePIN'))
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onCancel()
    })
    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet, {
      isVerifying: false,
      changePin: true,
    })
  })
})
