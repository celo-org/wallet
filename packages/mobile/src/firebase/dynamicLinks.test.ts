import dynamicLinks from '@react-native-firebase/dynamic-links'
import { generateShortLink } from 'src/firebase/dynamicLinks'

describe(generateShortLink, () => {
  const buildShortLink = dynamicLinks().buildShortLink as jest.Mock
  it('succeeds', async () => {
    buildShortLink.mockResolvedValueOnce('shortLink')
    const result = await generateShortLink({
      link: `https://celo.org/build/wallet`,
      appStoreId: '123456789',
      bundleId: 'org.celo.mobile.integration',
      shortLinkType: 'UNGUESSABLE',
    })
    expect(result).toEqual('shortLink')
  })

  it('fails and falls back to link', async () => {
    buildShortLink.mockRejectedValueOnce('test')
    const link = `https://celo.org/build/wallet`
    const result = await generateShortLink({
      link,
      appStoreId: '123456789',
      bundleId: 'org.celo.mobile.integration',
      shortLinkType: 'UNGUESSABLE',
    })
    expect(result).toEqual(link)
  })
})
