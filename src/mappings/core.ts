import { ethereum, dataSource } from '@graphprotocol/graph-ts'
import { Pair } from '../types/schema'

import { createPairTokenPrice, PairTokenPriceTimeframe } from './helpers'

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
