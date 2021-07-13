import { validateMnemonic } from '@celo/utils/lib/account'
import * as bip39 from 'react-native-bip39'
import { formatBackupPhraseOnEdit, formatBackupPhraseOnSubmit } from 'src/backup/utils'

describe('Mnemonic validation and formatting', () => {
  const SPANISH_MNEMONIC =
    'avance colmo poema momia cofre pata res verso secta cinco tubería yacer eterno observar ojo tabaco seta ruina bebé oral miembro gato suelo violín'

  const SPANISH_MNEMONIC_NO_ACCENTS =
    'avance colmo poema momia cofre pata res verso secta cinco tuberia yacer eterno observar ojo tabaco seta ruina bebe oral miembro gato suelo violin'

  const BAD_SPANISH_MNEMONIC =
    'avance colmo poema momia cofre pata res verso secta cinco tuberia yacer eterno observar ojo tabaco seta ruina bebé oralio miembro gato suelo violín'

  const PORTUGUESE_MNEMONIC =
    'cheiro lealdade duplo oposto vereador acessar lanche regra prefeito apego ratazana piedade alarme marmita subsolo brochura honrado viajar magnata canoa sarjeta terno cimento prezar'

  const BAD_PORTUGUESE_MNEMONIC =
    'cheiro lealdade duplo oposto vereador acessar lanche regra prefeito apego ratazana piedade alarme marmita subsolo brochura honrado viajar magnata canoa sarjeto terno cimento prezar'

  const ENGLISH_MNEMONIC =
    'there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband inner surprise invest'

  const MULTILINE_ENGLISH_MNEMONIC = `there resist cinnamon water salmon
spare thumb explain equip uniform control
divorce mushroom head vote below
setup marriage oval topic husband
inner surprise invest`

  const MULTILINE_ENGLISH_MNEMONIC_EXTRA_SPACES = MULTILINE_ENGLISH_MNEMONIC.replace(
    'spare',
    '  spare \r\n'
  ).replace('surprise', ' surprise ')

  const MULTILINE_ENGLISH_MNEMONIC_UNTRIMMED_UNCASED =
    '   ' + MULTILINE_ENGLISH_MNEMONIC_EXTRA_SPACES.replace(/s/g, 'S') + '  '

  const BAD_ENGLISH_MNEMONIC =
    'there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband'

  it('formats spacing correctly on edit', () => {
    expect(formatBackupPhraseOnEdit(MULTILINE_ENGLISH_MNEMONIC_EXTRA_SPACES)).toEqual(
      ENGLISH_MNEMONIC
    )
  })

  it('formats spacing correctly on submit', () => {
    expect(formatBackupPhraseOnSubmit(MULTILINE_ENGLISH_MNEMONIC_UNTRIMMED_UNCASED)).toEqual(
      ENGLISH_MNEMONIC
    )
  })

  it('validates spanish successfully', () => {
    const mnemonic = formatBackupPhraseOnSubmit(SPANISH_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeTruthy()
  })

  it('validates spanish successfully without mnemonic accents', () => {
    const mnemonic = formatBackupPhraseOnSubmit(SPANISH_MNEMONIC_NO_ACCENTS)
    expect(validateMnemonic(mnemonic, bip39)).toBeTruthy()
  })

  it('validates portuguese successfully', () => {
    const mnemonic = formatBackupPhraseOnSubmit(PORTUGUESE_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeTruthy()
  })

  it('validates english successfully', () => {
    const mnemonic = formatBackupPhraseOnSubmit(ENGLISH_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeTruthy()
  })

  it('validates english multiline successfully', () => {
    const mnemonic = formatBackupPhraseOnSubmit(MULTILINE_ENGLISH_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeTruthy()
  })

  it('does not validate bad english', () => {
    const mnemonic = formatBackupPhraseOnSubmit(BAD_ENGLISH_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeFalsy()
  })

  it('does not validate bad spanish', () => {
    const mnemonic = formatBackupPhraseOnSubmit(BAD_SPANISH_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeFalsy()
  })

  it('does not validate bad portuguese', () => {
    const mnemonic = formatBackupPhraseOnSubmit(BAD_PORTUGUESE_MNEMONIC)
    expect(validateMnemonic(mnemonic, bip39)).toBeFalsy()
  })
})
