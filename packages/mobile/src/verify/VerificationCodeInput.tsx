import { hexToBuffer } from '@celo/utils/lib/address'
import {
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import React, { useEffect } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import { setAttestationInputStatus } from 'src/identity/actions'
import {
  acceptedAttestationCodesSelector,
  ATTESTATION_CODE_PLACEHOLDER,
  attestationCodesSelector,
  attestationInputStatusSelector,
} from 'src/identity/reducer'
import { AttestationCode } from 'src/identity/verification'
import Logger from 'src/utils/Logger'
import { indexReadyForInput } from 'src/verify/utils'

interface Props {
  label: string
  index: number // index of code in attestationCodes array
  inputValue: string // the raw code inputed by the user
  inputPlaceholder: string
  inputPlaceholderWithClipboardContent: string
  onInputChange: (value: string, processCodeIfValid?: boolean) => void
  style?: StyleProp<ViewStyle>
  shortVerificationCodesEnabled: boolean
  testID?: string
}

function isAttestationAccepted(
  acceptedAttestationCodes: AttestationCode[],
  attestationCode: AttestationCode
) {
  return (
    attestationCode.code === ATTESTATION_CODE_PLACEHOLDER ||
    acceptedAttestationCodes.some((code) => code.code === attestationCode.code)
  )
}

function VerificationCodeInput({
  label,
  index,
  inputValue,
  inputPlaceholder,
  inputPlaceholderWithClipboardContent,
  onInputChange,
  style,
  shortVerificationCodesEnabled,
  testID,
}: Props) {
  const attestationCodes = useSelector(attestationCodesSelector)
  const acceptedAttestationCodes = useSelector(acceptedAttestationCodesSelector)
  const attestationInputStatus = useSelector(attestationInputStatusSelector)
  const status = attestationInputStatus[index]

  const dispatch = useDispatch()

  // Set initial status
  useEffect(() => {
    const initialValue = getRecodedAttestationValue(
      attestationCodes[index],
      shortVerificationCodesEnabled
    )
    const isAccepted =
      attestationCodes[index] &&
      isAttestationAccepted(acceptedAttestationCodes, attestationCodes[index])
    let initialStatus
    if (isAccepted) {
      initialStatus = CodeInputStatus.Accepted
    } else if (initialValue) {
      initialStatus = CodeInputStatus.Received
    } else {
      initialStatus = CodeInputStatus.Inputting
      for (let i = 0; i < index; i++) {
        // If a previous input is empty (and hence inputting), this one should be disabled.
        if (!attestationCodes[i]) {
          initialStatus = CodeInputStatus.Disabled
        }
      }
    }
    dispatch(setAttestationInputStatus(index, initialStatus))
    onInputChange(initialValue, initialStatus === CodeInputStatus.Received)
  }, [])

  // Check if this attestation was accepted and mark it as such.
  useEffect(() => {
    if (attestationCodes[index] && status !== CodeInputStatus.Accepted) {
      if (isAttestationAccepted(acceptedAttestationCodes, attestationCodes[index])) {
        dispatch(setAttestationInputStatus(index, CodeInputStatus.Accepted))
      }
    }
  }, [status, attestationCodes[index], acceptedAttestationCodes])

  // Make sure there's always one input which is either |Inputting| or |Received|.
  // See |CodeInputStatus| for status descriptions.
  useEffect(() => {
    if (
      !attestationInputStatus.includes(CodeInputStatus.Inputting) &&
      !attestationInputStatus.includes(CodeInputStatus.Received)
    ) {
      const activeIndex = indexReadyForInput(attestationInputStatus)
      if (activeIndex === index) {
        dispatch(setAttestationInputStatus(index, CodeInputStatus.Inputting))
      }
    }
  }, [attestationInputStatus])

  // If there are attestation codes being processed show them in the input. This happens when they are
  // autoimported from Android.
  useEffect(() => {
    if (
      attestationCodes[index] &&
      !inputValue &&
      [CodeInputStatus.Received, CodeInputStatus.Processing, CodeInputStatus.Accepted].includes(
        status
      )
    ) {
      const code = getRecodedAttestationValue(
        attestationCodes[index],
        shortVerificationCodesEnabled
      )
      onInputChange(code, false)
    }
  }, [attestationCodes])

  // If there was an error empty the field.
  useEffect(() => {
    if (status === CodeInputStatus.Error) {
      onInputChange('', false)
    }
  }, [status])

  return (
    <CodeInput
      label={label}
      status={status}
      inputValue={inputValue}
      inputPlaceholder={inputPlaceholder}
      inputPlaceholderWithClipboardContent={inputPlaceholderWithClipboardContent}
      onInputChange={onInputChange}
      shouldShowClipboard={shouldShowClipboard(attestationCodes, shortVerificationCodesEnabled)}
      style={style}
      shortVerificationCodesEnabled={shortVerificationCodesEnabled}
      testID={testID}
    />
  )
}

function getRecodedAttestationValue(
  attestationCode: AttestationCode,
  shortVerificationCodesEnabled: boolean
) {
  try {
    if (!attestationCode?.code || attestationCode.code === ATTESTATION_CODE_PLACEHOLDER) {
      return ''
    }
    if (shortVerificationCodesEnabled && attestationCode.shortCode) {
      return attestationCode.shortCode
    }
    return hexToBuffer(attestationCode.code).toString('base64')
  } catch (error) {
    Logger.warn('VerificationCodeRow', 'Could not recode verification code to base64')
    return ''
  }
}

function shouldShowClipboard(
  attestationCodes: AttestationCode[],
  shortVerificationCodesEnabled: boolean
) {
  return (value: string) => {
    const extractedCode = shortVerificationCodesEnabled
      ? extractSecurityCodeWithPrefix(value)
      : extractAttestationCodeFromMessage(value)
    return (
      !!extractedCode &&
      !attestationCodes.find(
        (c) => (shortVerificationCodesEnabled ? c.shortCode : c.code) === extractedCode
      )
    )
  }
}

export default VerificationCodeInput
