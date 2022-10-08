/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address, ethereum, dataSource, Bytes, Entity, Value } from '@graphprotocol/graph-ts'
import { ERC20 } from '../types/Factory/ERC20'
import { ERC20SymbolBytes } from '../types/Factory/ERC20SymbolBytes'
import { ERC20NameBytes } from '../types/Factory/ERC20NameBytes'
import { Pair, PairTokenPrice } from '../types/schema'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  // hard coded overrides
  let network = dataSource.network() as string
  if (network == 'mainnet') {
    if (tokenAddress.toHexString() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') return 'DGD'
    if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') return 'AAVE'
  }
  if (network == 'arbitrum-one') {
    if (tokenAddress.toHexString() == '0x2e9a6df78e42a30712c10a9dc4b1c8656f8f2879') return 'MKR'
  }

  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  // hard coded overrides
  let network = dataSource.network() as string
  if (network == 'mainnet') {
    if (tokenAddress.toHexString() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') return 'DGD'
    if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') return 'Aave token'
  }
  if (network == 'arbitrum-one') {
    if (tokenAddress.toHexString() == '0x2e9a6df78e42a30712c10a9dc4b1c8656f8f2879') return 'Maker'
  }

  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    return totalSupplyResult.value
  }
  return BigInt.fromI32(0)
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  // hardcode overrides
  if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return BigInt.fromI32(18)
  }

  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    return BigInt.fromI32(decimalResult.value)
  }
  return BigInt.fromI32(0)
}
export abstract class PairTokenPriceTimeframe {
  static ONE_MINUTE: string = 'ONE_MINUTE'
  static FIVE_MINUTES: string = 'FIVE_MINUTES'
  static FIFTEEN_MINUTES: string = 'FIFTEEN_MINUTES'
  static ONE_HOUR: string = 'ONE_HOUR'
  static TWELVE_HOURS: string = 'TWELVE_HOURS'
}

export function createPairTokenPrice(id: string, block: ethereum.Block, pair: Pair, timeframe: string): void {
  let pairTokenPrice = new PairTokenPrice(id + '-' + timeframe)

  pairTokenPrice.blockNumber = block.number
  pairTokenPrice.blockTimestamp = block.timestamp
  pairTokenPrice.pair = pair.id
  pairTokenPrice.token0Price = pair.token0Price || ZERO_BD
  pairTokenPrice.token1Price = pair.token1Price || ZERO_BD
  pairTokenPrice.token0Address = Address.fromString(pair.token0 || ADDRESS_ZERO)
  pairTokenPrice.token1Address = Address.fromString(pair.token1 || ADDRESS_ZERO)
  pairTokenPrice.timeframe = timeframe

  pairTokenPrice.save()
}
