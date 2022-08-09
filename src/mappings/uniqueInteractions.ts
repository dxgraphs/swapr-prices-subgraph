import { ethereum, BigInt } from '@graphprotocol/graph-ts'

import { WeeklyUniqueAddressInteraction, DailyUniqueAddressInteraction, MonthlyUniqueAddressInteraction } from '../types/schema'
import { getWeekFromDate, getDateFromWeek, formatDate } from './helpers'

export function updateDailyUniqueInteractions(event: ethereum.Event): DailyUniqueAddressInteraction {
  const timestamp = event.block.timestamp.times(BigInt.fromString('1000')).toI64()
  const today = new Date(timestamp)

  const dayIdString = formatDate(today)

  let dailyUniqueAddressInteractionsData = DailyUniqueAddressInteraction.load(dayIdString)

  if (dailyUniqueAddressInteractionsData === null) {
    dailyUniqueAddressInteractionsData = new DailyUniqueAddressInteraction(dayIdString)

    dailyUniqueAddressInteractionsData.addresses = []
  }

  dailyUniqueAddressInteractionsData.save()

  return dailyUniqueAddressInteractionsData as DailyUniqueAddressInteraction
}

export function updateWeeklyUniqueInteractions(event: ethereum.Event): WeeklyUniqueAddressInteraction {
  const timestamp = event.block.timestamp.times(BigInt.fromString('1000')).toI64()
  const today = new Date(timestamp)

  const weekNumber = getWeekFromDate(today)
  const weekIdString = `${today.getUTCFullYear()}-${weekNumber}`

  let weeklyUniqueAddressInteractionsData = WeeklyUniqueAddressInteraction.load(weekIdString)

  if (weeklyUniqueAddressInteractionsData === null) {
    weeklyUniqueAddressInteractionsData = new WeeklyUniqueAddressInteraction(weekIdString)

    const weekStartDate = getDateFromWeek(today.getUTCFullYear(), weekNumber)
    const weekEndDate = getDateFromWeek(today.getUTCFullYear(), weekNumber)
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6)

    weeklyUniqueAddressInteractionsData.weekStart = formatDate(weekStartDate)
    weeklyUniqueAddressInteractionsData.weekEnd = formatDate(weekEndDate)

    weeklyUniqueAddressInteractionsData.addresses = []
  }

  weeklyUniqueAddressInteractionsData.save()

  return weeklyUniqueAddressInteractionsData as WeeklyUniqueAddressInteraction
}

export function updateMonthlyUniqueInteractions(event: ethereum.Event): MonthlyUniqueAddressInteraction {
  const timestamp = event.block.timestamp.times(BigInt.fromString('1000')).toI64()
  const today = new Date(timestamp)

  const monthIdString = formatDate(today).substring(0, 7)

  let monthlyUniqueAddressInteractionsData = MonthlyUniqueAddressInteraction.load(monthIdString)

  if (monthlyUniqueAddressInteractionsData === null) {
    monthlyUniqueAddressInteractionsData = new MonthlyUniqueAddressInteraction(monthIdString)

    monthlyUniqueAddressInteractionsData.addresses = []
  }

  monthlyUniqueAddressInteractionsData.save()

  return monthlyUniqueAddressInteractionsData as MonthlyUniqueAddressInteraction
}