const getInitialLink = jest.fn()
const buildShortLink = jest.fn()
const resolveLink = jest.fn()

export default function links() {
  return {
    getInitialLink,
    buildShortLink,
    resolveLink,
  }
}
