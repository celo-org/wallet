import BigNumber from 'bignumber.js'
import { GAS_PRICE_INFLATION_FACTOR } from 'src/config'
import { getCurrencyAddress } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'

const TAG = 'web3/gas'
const GAS_PRICE_STALE_AFTER = 150000 // 15 seconds

const gasPrice: { [currency in Currency]?: BigNumber } = {}
const gasPriceLastUpdated: { [currency in Currency]?: number } = {}

export async function getGasPrice(currency: Currency = Currency.Dollar): Promise<BigNumber> {
  Logger.debug(`${TAG}/getGasPrice`, 'Getting gas price')

  try {
    if (
      gasPrice[currency] === undefined ||
      gasPriceLastUpdated[currency] === undefined ||
      Date.now() - gasPriceLastUpdated[currency]! >= GAS_PRICE_STALE_AFTER
    ) {
      gasPrice[currency] = await fetchGasPrice(currency)
      gasPriceLastUpdated[currency] = Date.now()
    }
    return gasPrice[currency]!
  } catch (error) {
    Logger.error(`${TAG}/getGasPrice`, 'Could not fetch and update gas price.', error)
    throw new Error('Error fetching gas price')
  }
}

async function fetchGasPrice(currency: Currency): Promise<BigNumber> {
  const contractKit = await getContractKitAsync()
  const [gasPriceMinimum, address] = await Promise.all([
    contractKit.contracts.getGasPriceMinimum(),
    getCurrencyAddress(currency),
  ])
  const latestGasPrice = await gasPriceMinimum.getGasPriceMinimum(address)
  const inflatedGasPrice = latestGasPrice.times(GAS_PRICE_INFLATION_FACTOR)
  Logger.debug(
    TAG,
    'fetchGasPrice',
    `Result price in ${currency} with inflation: ${inflatedGasPrice.toString()}`
  )
  return inflatedGasPrice
}
