import { OdisUtils } from '@celo/identity'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { addContactsMatches } from 'src/identity/actions'
import { fetchContactMatches } from 'src/identity/matchmaking'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import { NumberToRecipient } from 'src/recipients/recipient'
import { isAccountUpToDate } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockE164Number,
  mockE164Number2,
  mockE164NumberHash,
  mockE164NumberPepper,
} from 'test/values'

jest.mock('@celo/identity', () => ({
  ...(jest.requireActual('@celo/identity') as any),
  ...(jest.requireActual('../../__mocks__/@celo/identity/index') as any),
  OdisUtils: jest.requireActual('@celo/identity').OdisUtils,
}))

describe('Fetch contact matches', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('retrieves matches correctly', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        success: true,
        matchedContacts: [
          {
            phoneNumber: 'Fox23FU+SCdDPhk2I2h4e2UC63lyOWMygxc4wTAXu9w=',
          },
        ],
      })
    )

    const e164NumberToRecipients: NumberToRecipient = {
      [mockE164Number]: {
        contactId: 'contactId1',
        name: 'contact1',
        e164PhoneNumber: mockE164Number,
      },
      [mockE164Number2]: {
        contactId: 'contactId2',
        name: 'contact2',
        e164PhoneNumber: mockE164Number2,
      },
      '+491515555555': {
        contactId: 'contactId3',
        name: 'contact3',
        e164PhoneNumber: '+491515555555',
      },
    }

    const phoneHashDetails: PhoneNumberHashDetails = {
      e164Number: mockE164Number,
      phoneHash: mockE164NumberHash,
      pepper: mockE164NumberPepper,
    }

    const expectedMatches = {
      [mockE164Number2]: { contactId: 'contactId2' },
    }

    const state = createMockStore({
      web3: { account: mockAccount },
      account: { pincodeType: PincodeType.CustomPin },
    }).getState()

    await expectSaga(fetchContactMatches, e164NumberToRecipients)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(getUserSelfPhoneHashDetails), phoneHashDetails],
        [matchers.call.fn(isAccountUpToDate), true],
        [matchers.call.fn(OdisUtils.Matchmaking.getContactMatches), [mockE164Number2]],
      ])
      .withState(state)
      .put(addContactsMatches(expectedMatches))
      .run()
  })
})
