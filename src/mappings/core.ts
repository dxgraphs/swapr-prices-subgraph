import { BigDecimal, ethereum, dataSource } from '@graphprotocol/graph-ts'
import { Pair, Token } from '../types/schema'
import { Sync } from '../types/templates/Pair/Pair'

import { getNativeCurrencyPriceInUSD, findNativeCurrencyPerToken, getTrackedLiquidityUSD } from './pricing'
import { convertTokenToDecimal, ZERO_BD, createPairTokenPrice, PairTokenPriceTimeframe } from './helpers'
import { getBundle, getSwaprFactory } from './factory'

export function handlePairTokenPrice(block: ethereum.Block): void {
  let pairContractAddress = dataSource.address()
  let pair = Pair.load(pairContractAddress.toHexString())

  if (!pair) {
    return
  }

  const blockTimestampDate = new Date(block.timestamp.toI64() * 1000)
  const blockTimestampMinutes = blockTimestampDate.getUTCMinutes()
  const blockTimestampHours = blockTimestampDate.getUTCHours()

  const id = [
    pair.id,
    blockTimestampDate.getUTCFullYear().toString(),
    blockTimestampDate.getUTCMonth().toString(),
    blockTimestampHours.toString(),
    blockTimestampMinutes.toString()
  ].join('-')

  const fiveMinutes = 5
  const fifteenMinutes = 15
  const twelveHours = 12

  if (blockTimestampMinutes % fiveMinutes === 0) {
    createPairTokenPrice(id, block, pair, PairTokenPriceTimeframe.FIVE_MINUTES)
  }

  if (blockTimestampMinutes % fifteenMinutes === 0) {
    createPairTokenPrice(id, block, pair, PairTokenPriceTimeframe.FIFTEEN_MINUTES)
  }

  if (blockTimestampMinutes === 0) {
    createPairTokenPrice(id, block, pair, PairTokenPriceTimeframe.ONE_HOUR)
  }

  if (blockTimestampHours % twelveHours === 0 && blockTimestampMinutes === 0) {
    createPairTokenPrice(id, block, pair, PairTokenPriceTimeframe.TWELVE_HOURS)
  }
}

export function handleSync(event: Sync): void {
  let pair = Pair.load(event.address.toHex()) as Pair
  let token0 = Token.load(pair.token0) as Token
  let token1 = Token.load(pair.token1) as Token
  let swapr = getSwaprFactory()

  // reset factory liquidity by subtracting onluy tarcked liquidity
  swapr.totalLiquidityNativeCurrency = swapr.totalLiquidityNativeCurrency.minus(
    pair.trackedReserveNativeCurrency as BigDecimal
  )

  // reset token total liquidity amounts
  token0.totalLiquidity = token0.totalLiquidity.minus(pair.reserve0)
  token1.totalLiquidity = token1.totalLiquidity.minus(pair.reserve1)

  pair.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals)
  pair.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals)

  if (pair.reserve1.notEqual(ZERO_BD)) pair.token0Price = pair.reserve0.div(pair.reserve1)
  else pair.token0Price = ZERO_BD
  if (pair.reserve0.notEqual(ZERO_BD)) pair.token1Price = pair.reserve1.div(pair.reserve0)
  else pair.token1Price = ZERO_BD

  pair.save()

  // update native currency price now that reserves could have changed
  let bundle = getBundle()
  bundle.nativeCurrencyPrice = getNativeCurrencyPriceInUSD()
  bundle.save()

  token0.derivedNativeCurrency = findNativeCurrencyPerToken(token0 as Token)
  token1.derivedNativeCurrency = findNativeCurrencyPerToken(token1 as Token)
  token0.save()
  token1.save()

  // get tracked liquidity - will be 0 if neither is in whitelist
  let trackedLiquidityNativeCurrency: BigDecimal
  if (bundle.nativeCurrencyPrice.notEqual(ZERO_BD)) {
    trackedLiquidityNativeCurrency = getTrackedLiquidityUSD(
      pair.reserve0,
      token0 as Token,
      pair.reserve1,
      token1 as Token
    ).div(bundle.nativeCurrencyPrice)
  } else {
    trackedLiquidityNativeCurrency = ZERO_BD
  }

  // use derived amounts within pair
  pair.trackedReserveNativeCurrency = trackedLiquidityNativeCurrency
  pair.reserveNativeCurrency = pair.reserve0
    .times(token0.derivedNativeCurrency as BigDecimal)
    .plus(pair.reserve1.times(token1.derivedNativeCurrency as BigDecimal))
  pair.reserveUSD = pair.reserveNativeCurrency.times(bundle.nativeCurrencyPrice)

  // use tracked amounts globally
  swapr.totalLiquidityNativeCurrency = swapr.totalLiquidityNativeCurrency.plus(trackedLiquidityNativeCurrency)
  swapr.totalLiquidityUSD = swapr.totalLiquidityNativeCurrency.times(bundle.nativeCurrencyPrice)

  // now correctly set liquidity amounts for each token
  token0.totalLiquidity = token0.totalLiquidity.plus(pair.reserve0)
  token1.totalLiquidity = token1.totalLiquidity.plus(pair.reserve1)

  // save entities
  pair.save()
  swapr.save()
  token0.save()
  token1.save()
}
