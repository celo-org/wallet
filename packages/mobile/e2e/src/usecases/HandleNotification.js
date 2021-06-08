export default HandleNotification = () => {
  it('Launch app from push notification #BVT', async () => {
    const userNotification = {
      trigger: {
        type: 'push',
      },
      title: 'From push',
      subtitle: 'Subtitle',
      body: 'Body',
      badge: 1,
      payload: {
        ou: 'https://celo.org',
      },
      category: 'org.celo.mobile.test',
      'content-available': 0,
      'action-identifier': 'default',
    }

    await device.launchApp({ newInstance: true, userNotification })
  })
}
