import twilio from 'twilio'
import { sleep } from './utils'

const accountSid = process.env.TWILIO_ACCOUNT_SID || '<Insert Account SID>'
const authToken = process.env.TWILIO_AUTH_TOKEN || '<Insert Auth Token>'
const client = twilio(accountSid, authToken)

const MAX_TRIES = 120

export const receiveSms = async () => {
  let tryNumber = 0

  while (tryNumber < MAX_TRIES) {
    const messages = await client.messages.list({
      dateSentAfter: new Date(Date.now() - 3 * 60 * 1000),
      limit: 3,
    })
    const codes = messages.map((message) => message.body.split(': ')[1])
    console.log('Codes received:', codes)
    if (codes.length === 3) {
      console.log(codes)
      return codes
    }
    tryNumber += 1
    await sleep(1000)
  }
  return []
}
