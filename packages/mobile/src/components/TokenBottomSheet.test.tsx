import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

jest.mock('src/components/useShowOrHideAnimation')

const mockStore = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '10', [Currency.Euro]: '20' },
  },
})

const onCurrencySelectedMock = jest.fn()

describe('TokenBottomSheet', () => {
  beforeAll(() => {
    // @ts-ignore This avoids an error, see: https://github.com/software-mansion/react-native-reanimated/issues/1380
    global.__reanimatedWorkletInit = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderPicker(visible: boolean) {
    return render(
      <Provider store={mockStore}>
        <TokenBottomSheet
          isVisible={visible}
          origin={TokenPickerOrigin.Send}
          onCurrencySelected={onCurrencySelectedMock}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const tree = renderPicker(true)

    expect(tree.queryByTestId('TokenBottomSheetContainer')).toBeTruthy()
    expect(tree.queryByTestId('LocalcUSDBalance')).toBeTruthy()
    expect(tree.queryByTestId('cUSDBalance')).toBeTruthy()
    expect(tree.queryByTestId('LocalcEURBalance')).toBeTruthy()
    expect(tree.queryByTestId('cEURBalance')).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('handles the choosing of a currency correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(onCurrencySelectedMock).toHaveBeenLastCalledWith(Currency.Dollar)

    fireEvent.press(getByTestId('cEURTouchable'))
    expect(onCurrencySelectedMock).toHaveBeenLastCalledWith(Currency.Euro)
  })

  it('renders nothing if not visible', () => {
    const { queryByTestId } = renderPicker(false)
    expect(queryByTestId('TokenBottomSheetContainer')).toBeFalsy()
  })
})