import { ethereum, BigInt } from '@graphprotocol/graph-ts'

import {
  WeeklyUniqueAddressInteraction,
  DailyUniqueAddressInteraction,
  MonthlyUniqueAddressInteraction
} from '../types/schema'
import { getWeekNumberFromDate, getDateFromWeek, formatDate } from './helpers'

export function updateDailyUniqueInteractions(event: ethereum.Event): DailyUniqueAddressInteraction {
  const timestamp = event.block.timestamp.times(BigInt.fromString('1000')).toI64()
  const today = new Date(timestamp)

  const dayIdString = formatDate(today)
  const startOfDayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  let dailyUniqueAddressInteractionsData = DailyUniqueAddressInteraction.load(dayIdString)

  if (dailyUniqueAddressInteractionsData === null) {
    dailyUniqueAddressInteractionsData = new DailyUniqueAddressInteraction(dayIdString)
    dailyUniqueAddressInteractionsData.timestamp = (startOfDayDate.getTime() / 1000) as i32

    dailyUniqueAddressInteractionsData.addresses = []
  }

  dailyUniqueAddressInteractionsData.save()

  return dailyUniqueAddressInteractionsData as DailyUniqueAddressInteraction
}

export function updateWeeklyUniqueInteractions(event: ethereum.Event): WeeklyUniqueAddressInteraction {
  const timestamp = event.block.timestamp.times(BigInt.fromString('1000')).toI64()
  const today = new Date(timestamp)

  const weekNumber = getWeekNumberFromDate(today)
  const weekIdString = `${today.getUTCFullYear()}-${weekNumber}`

  let weeklyUniqueAddressInteractionsData = WeeklyUniqueAddressInteraction.load(weekIdString)

  if (weeklyUniqueAddressInteractionsData === null) {
    weeklyUniqueAddressInteractionsData = new WeeklyUniqueAddressInteraction(weekIdString)

    const startOfWeekDate = getDateFromWeek(today.getUTCFullYear(), weekNumber)
    const endOfWeekDate = getDateFromWeek(today.getUTCFullYear(), weekNumber)
    endOfWeekDate.setUTCDate(endOfWeekDate.getUTCDate() + 6)

    weeklyUniqueAddressInteractionsData.timestampStart = (startOfWeekDate.getTime() / 1000) as i32
    weeklyUniqueAddressInteractionsData.timestampEnd = (endOfWeekDate.getTime() / 1000) as i32

    weeklyUniqueAddressInteractionsData.addresses = []
  }

  weeklyUniqueAddressInteractionsData.save()

  return weeklyUniqueAddressInteractionsData as WeeklyUniqueAddressInteraction
}

export function updateMonthlyUniqueInteractions(event: ethereum.Event): MonthlyUniqueAddressInteraction {
  const timestamp = event.block.timestamp.times(BigInt.fromString('1000')).toI64()
  const today = new Date(timestamp)

  const monthIdString = formatDate(today).substring(0, 7)
  const startOfMonthDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))

  let monthlyUniqueAddressInteractionsData = MonthlyUniqueAddressInteraction.load(monthIdString)

  if (monthlyUniqueAddressInteractionsData === null) {
    monthlyUniqueAddressInteractionsData = new MonthlyUniqueAddressInteraction(monthIdString)
    monthlyUniqueAddressInteractionsData.timestamp = (startOfMonthDate.getTime() / 1000) as i32

    monthlyUniqueAddressInteractionsData.addresses = []
  }

  monthlyUniqueAddressInteractionsData.save()

  return monthlyUniqueAddressInteractionsData as MonthlyUniqueAddressInteraction
}
