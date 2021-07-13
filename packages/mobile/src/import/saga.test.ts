import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { dynamic } from 'redux-saga-test-plan/providers'
import { call, fork, delay, select } from 'redux-saga/effects'
import { createMockTask } from '@redux-saga/testing-utils'
import { setBackupCompleted } from 'src/account/actions'
import { uploadNameAndPicture } from 'src/account/profileInfo'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import { importBackupPhraseFailure, importBackupPhraseSuccess } from 'src/import/actions'
import { importBackupPhraseSaga, MNEMONIC_AUTOCORRECT_TIMEOUT } from 'src/import/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import { assignAccountFromPrivateKey, waitWeb3LastBlock } from 'src/web3/saga'

const mockPhraseValid =
  'oil please secret math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course expire'
// Same phrase as above, but with the last word replaced with a different BIP-39 word.
const mockPhraseInvalidChecksum =
  'oil please secret math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course tent'
// Same phrase as above, but with several words altered to invalid words.
const mockPhraseInvalidWords =
  'oil please secret math surfer mesh retreat prosper quit traffic spectical creek educate rate weasel wade swig crystal day swim frosty oxygen course expire'
const mockValidSpanishPhrase =
  'tajo fiera asunto tono aroma palma toro caos lobo espada número rato hacha largo pedir cemento urbe tejado volcán mimo grueso juvenil pueblo desvío'

// Account derived from the English mnemonic above.
const mockAccount = '0xb43FBBBF76973b64e0980f5f4781d7cE9A7DBDDb'

// Creates a mock task factory to use as a synamic value for redux-saga-test-plan mock.
// If not value is provided, the task will never complete.
const mockBalanceTask = (value?: number) => {
  return () => {
    const task = createMockTask()
    if (value !== undefined) {
      task.setResult(new BigNumber(value))
      task.setRunning(false)
      // @ts-ignore Add an undocumented method, called by join, to Task ಠ_ಠ
      task.isAborted = () => false
    }
    return task
  }
}

describe('Import wallet saga', () => {
  const expectSuccessfulSagaWithPhrase = async (phrase: string) => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(10))],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, phrase, mockAccount), true],
        [select(recoveringFromStoreWipeSelector), false],
        [call(uploadNameAndPicture)],
      ])
      .put(setBackupCompleted())
      .put(refreshAllBalances())
      .put(importBackupPhraseSuccess())
      .run()
  }

  it('imports a valid phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockPhraseValid)
  })

  it('imports a valid spanish phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockValidSpanishPhrase)
  })

  it('fails for a phrase invalid checksum', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, {
      phrase: mockPhraseInvalidChecksum,
      useEmptyWallet: false,
    })
      .provide([
        [call(waitWeb3LastBlock), true],
        [select(currentLanguageSelector), 'english'],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(0))],
        [delay(MNEMONIC_AUTOCORRECT_TIMEOUT), true],
      ])
      .put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      .put(importBackupPhraseFailure())
      .run()
  })

  it('imports a phrase with invalid words after autocorrection', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, {
      phrase: mockPhraseInvalidWords,
      useEmptyWallet: false,
    })
      .provide([
        [call(waitWeb3LastBlock), true],
        [select(currentLanguageSelector), 'english'],
        // Respond only to the true correct address with a positive balance.
        [
          fork(fetchTokenBalanceInWeiWithRetry, Currency.Dollar, mockAccount),
          dynamic(mockBalanceTask(10)),
        ],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask())],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, mockPhraseValid, mockAccount), true],
        [select(recoveringFromStoreWipeSelector), false],
        [call(uploadNameAndPicture)],
      ])
      .put(setBackupCompleted())
      .put(refreshAllBalances())
      .put(importBackupPhraseSuccess())
      .run()
  })

  it('rejects a phrase with invalid words after failed autocorrection', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, {
      phrase: mockPhraseInvalidWords,
      useEmptyWallet: false,
    })
      .provide([
        [call(waitWeb3LastBlock), true],
        [select(currentLanguageSelector), 'english'],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(0))],
        [delay(MNEMONIC_AUTOCORRECT_TIMEOUT), true],
      ])
      .put(
        showError(ErrorMessages.INVALID_WORDS_IN_BACKUP_PHRASE, null, {
          ns: 'global',
          invalidWords: 'surfer, spectical, wade, swig, frosty',
        })
      )
      .put(importBackupPhraseFailure())
      .run()
  })

  it('asks the user to confirm import of an empty phrase', async () => {
    // @ts-ignore
    await expectSaga(importBackupPhraseSaga, { phrase: mockPhraseValid, useEmptyWallet: false })
      .provide([
        [call(waitWeb3LastBlock), true],
        [select(currentLanguageSelector), 'english'],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(0))],
      ])
      .run()

    // Expect that the user be redirected back to the import wallet screen.
    expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet, {
      clean: false,
      showZeroBalanceModal: true,
    })
  })
})
