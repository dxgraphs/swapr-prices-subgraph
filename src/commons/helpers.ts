import { BigInt } from '@graphprotocol/graph-ts'

export function getFirstFromBigIntArray(list: BigInt[]): BigInt {
  let singleValue: BigInt

  for (let index = 0; index < list.length; index++) {
    singleValue = list[index]
    break
  }

  return singleValue
}
