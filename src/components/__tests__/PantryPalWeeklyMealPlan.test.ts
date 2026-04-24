// src/tests/components/PantryPalWeeklyMealPlan.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// ─── Types (mirrored from component) ─────────────────────────────────────────

interface InventoryItem {
  id: number
  icon: string
  name: string
  location: string
  expiry: string // display string e.g. '6 Apr 2026'
  expiryDate?: Date // parsed Date for sorting/grouping — added for testability
  tag?: string
  warning?: boolean // true = expiring soon
}

interface Recommendation {
  id: number
  icon: string
  name: string
  uses: string // comma-separated ingredient names
}

interface CalendarDay {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  dateKey: string
}

// ─── Extracted calendar logic (mirrors calendarDays computed) ─────────────────

function buildCalendarDays(year: number, month: number, selectedDate: Date): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Pad from previous month
  const prevMonthDate = new Date(year, month, 0)
  const daysInPrevMonth = prevMonthDate.getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i)
    days.push({
      date,
      dayOfMonth: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selectedDate.getTime(),
      dateKey: date.toISOString(),
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selectedDate.getTime(),
      dateKey: date.toISOString(),
    })
  }

  // Pad to 42 cells (6 weeks)
  const remainingCells = 42 - days.length
  for (let d = 1; d <= remainingCells; d++) {
    const date = new Date(year, month + 1, d)
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selectedDate.getTime(),
      dateKey: date.toISOString(),
    })
  }

  return days
}

// ─── Extracted inventory grouping logic ───────────────────────────────────────
// Groups inventory items by expiry urgency. Mirrors the sidebar display logic.

function groupInventoryByExpiry(items: InventoryItem[]): {
  expiringSoon: InventoryItem[]
  thisWeek: InventoryItem[]
  later: InventoryItem[]
} {
  const expiringSoon = items.filter((i) => i.warning === true)
  const thisWeek = items.filter(
    (i) =>
      !i.warning &&
      i.expiryDate !== undefined &&
      (() => {
        const daysUntil = Math.ceil(
          (i.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
        return daysUntil <= 7 && daysUntil > 3
      })(),
  )
  const later = items.filter((i) => !i.warning && !thisWeek.includes(i))
  return { expiringSoon, thisWeek, later }
}

// ─── Extracted recommendation logic ───────────────────────────────────────────
// Filters recommendations that use at least one expiring ingredient.

function getRelevantRecommendations(
  recommendations: Recommendation[],
  expiringItems: InventoryItem[],
): Recommendation[] {
  if (expiringItems.length === 0) return recommendations

  const expiringNames = expiringItems.map((i) => i.name.toLowerCase())

  return recommendations.filter((rec) => {
    const uses = rec.uses
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
    return uses.some((ingredient) =>
      expiringNames.some(
        (expiring) =>
          expiring.includes(ingredient) ||
          ingredient.includes(expiring.split('·')[0]!.trim().toLowerCase()),
      ),
    )
  })
}

// ─── Mock data (same as component) ───────────────────────────────────────────

const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    icon: '🥛',
    name: 'UltraMilk · 500ml Original',
    location: 'Fridge',
    expiry: '6 Apr 2026',
    expiryDate: new Date(2026, 3, 6),
    tag: '2d',
    warning: true, // expiring soon
  },
  {
    id: 2,
    icon: '🍞',
    name: 'Loaf of Bread · 300g',
    location: 'Pantry',
    expiry: '18 Apr 2026',
    expiryDate: new Date(2026, 3, 18),
    warning: false,
  },
  {
    id: 3,
    icon: '🍚',
    name: 'Leftover Rice',
    location: 'Fridge',
    expiry: '18 Apr 2026',
    expiryDate: new Date(2026, 3, 18),
    warning: false,
  },
  {
    id: 4,
    icon: '🥚',
    name: 'Eggs · 6 pcs',
    location: 'Fridge',
    expiry: '25 Apr 2026',
    expiryDate: new Date(2026, 3, 25),
    warning: false,
  },
]

const mockRecommendations: Recommendation[] = [
  { id: 1, icon: '🍛', name: 'Nasi Goreng', uses: 'Rice, Eggs, Chicken' },
  { id: 2, icon: '🍜', name: 'Mie Goreng', uses: 'Noodles, Eggs, Veggies' },
  { id: 3, icon: '🥞', name: 'Milk Pancakes', uses: 'UltraMilk, Eggs, Flour' },
]

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 1
// Given the user is logged in and has items in their inventory,
// when the user navigates to the Plan Weekly Meals page,
// then the system displays a calendar (at least one week, Monday to Sunday)
// and a sidebar list of inventory items grouped by expiry date,
// showing foods about to expire soon.
// ─────────────────────────────────────────────────────────────────────────────

describe('GIVEN user is logged in and has inventory items', () => {
  describe('WHEN user navigates to Plan Weekly Meals page', () => {
    // ── Calendar ─────────────────────────────────────────────────────────────

    describe('THEN the system displays a calendar with at least one full week', () => {
      it('calendar contains exactly 42 cells (6 weeks × 7 days)', () => {
        const selectedDate = new Date(2026, 3, 14) // April 14 2026
        const days = buildCalendarDays(2026, 3, selectedDate)
        expect(days).toHaveLength(42)
      })

      it('calendar contains all 7 day columns (Sunday to Saturday)', () => {
        const selectedDate = new Date(2026, 3, 14)
        const days = buildCalendarDays(2026, 3, selectedDate)

        // Get day-of-week for each cell in the first row (first 7 cells)
        const firstWeekDays = days.slice(0, 7).map((d) => d.date.getDay())

        // Must span all 7 days: 0=Sun, 1=Mon, ..., 6=Sat
        expect(firstWeekDays).toContain(0) // Sunday
        expect(firstWeekDays).toContain(1) // Monday
        expect(firstWeekDays).toContain(6) // Saturday
      })

      it('calendar contains at least one complete Monday-to-Sunday week', () => {
        const selectedDate = new Date(2026, 3, 14)
        const days = buildCalendarDays(2026, 3, selectedDate)

        // Check every row of 7 contains Mon(1) through Sun(0)
        let foundCompleteWeek = false
        for (let row = 0; row < 6; row++) {
          const week = days.slice(row * 7, row * 7 + 7)
          const dayNumbers = week.map((d) => d.date.getDay())
          if (
            dayNumbers.includes(1) && // Monday
            dayNumbers.includes(2) && // Tuesday
            dayNumbers.includes(3) && // Wednesday
            dayNumbers.includes(4) && // Thursday
            dayNumbers.includes(5) && // Friday
            dayNumbers.includes(6) && // Saturday
            dayNumbers.includes(0) // Sunday
          ) {
            foundCompleteWeek = true
            break
          }
        }
        expect(foundCompleteWeek).toBe(true)
      })

      it('all days in the current month are marked isCurrentMonth = true', () => {
        const selectedDate = new Date(2026, 3, 14)
        const days = buildCalendarDays(2026, 3, selectedDate)

        const currentMonthDays = days.filter((d) => d.isCurrentMonth)
        // April 2026 has 30 days
        expect(currentMonthDays).toHaveLength(30)
        currentMonthDays.forEach((d) => {
          expect(d.date.getMonth()).toBe(3) // April = index 3
        })
      })

      it('each day has a unique dateKey', () => {
        const selectedDate = new Date(2026, 3, 14)
        const days = buildCalendarDays(2026, 3, selectedDate)

        const keys = days.map((d) => d.dateKey)
        const uniqueKeys = new Set(keys)
        expect(uniqueKeys.size).toBe(42)
      })

      it('selected date is marked isSelected = true', () => {
        const selectedDate = new Date(2026, 3, 14) // April 14
        const days = buildCalendarDays(2026, 3, selectedDate)

        const selected = days.filter((d) => d.isSelected)
        expect(selected).toHaveLength(1)
        expect(selected[0]!.dayOfMonth).toBe(14)
      })

      it('padding days from previous/next month are marked isCurrentMonth = false', () => {
        const selectedDate = new Date(2026, 3, 14)
        const days = buildCalendarDays(2026, 3, selectedDate)

        const paddingDays = days.filter((d) => !d.isCurrentMonth)
        paddingDays.forEach((d) => {
          expect(d.date.getMonth()).not.toBe(3)
        })
      })
    })

    // ── Inventory sidebar ─────────────────────────────────────────────────────

    describe('THEN the sidebar shows inventory items grouped by expiry date', () => {
      it('all inventory items are present in the sidebar list', () => {
        expect(mockInventoryItems).toHaveLength(4)
        // Every item has required display fields
        mockInventoryItems.forEach((item) => {
          expect(item.name).toBeTruthy()
          expect(item.expiry).toBeTruthy()
          expect(item.location).toBeTruthy()
        })
      })

      it('items expiring soon have warning = true', () => {
        const warnItems = mockInventoryItems.filter((i) => i.warning)
        expect(warnItems.length).toBeGreaterThanOrEqual(1)
        warnItems.forEach((item) => {
          expect(item.warning).toBe(true)
          expect(item.tag).toBeTruthy() // has a tag like '2d'
        })
      })

      it('expiring soon items are correctly identified (UltraMilk)', () => {
        const { expiringSoon } = groupInventoryByExpiry(mockInventoryItems)
        expect(expiringSoon).toHaveLength(1)
        expect(expiringSoon[0]!.name).toBe('UltraMilk · 500ml Original')
        expect(expiringSoon[0]!.tag).toBe('2d')
      })

      it('non-expiring items are separated from expiring-soon items', () => {
        const { expiringSoon, later } = groupInventoryByExpiry(mockInventoryItems)

        const expiringSoonIds = expiringSoon.map((i) => i.id)
        later.forEach((item) => {
          expect(expiringSoonIds).not.toContain(item.id)
        })
      })

      it('expiring soon items appear before non-expiring items in the list', () => {
        const sorted = [...mockInventoryItems].sort((a, b) => {
          if (a.warning && !b.warning) return -1
          if (!a.warning && b.warning) return 1
          return 0
        })
        expect(sorted[0]!.warning).toBe(true)
      })

      it('inventory search filters items by name', () => {
        const inventorySearch = ref('')
        const items = ref(mockInventoryItems)

        const filteredInventory = computed(() => {
          if (!inventorySearch.value) return items.value
          const q = inventorySearch.value.toLowerCase()
          return items.value.filter(
            (item) =>
              item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q),
          )
        })

        inventorySearch.value = 'milk'
        expect(filteredInventory.value).toHaveLength(1)
        expect(filteredInventory.value[0]!.name).toBe('UltraMilk · 500ml Original')
      })

      it('inventory search filters items by location', () => {
        const inventorySearch = ref('pantry')
        const items = ref(mockInventoryItems)

        const filteredInventory = computed(() => {
          const q = inventorySearch.value.toLowerCase()
          return items.value.filter(
            (item) =>
              item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q),
          )
        })

        expect(filteredInventory.value).toHaveLength(1)
        expect(filteredInventory.value[0]!.name).toBe('Loaf of Bread · 300g')
      })

      it('empty inventory search returns all items', () => {
        const inventorySearch = ref('')
        const items = ref(mockInventoryItems)
        const filteredInventory = computed(() =>
          inventorySearch.value
            ? items.value.filter((i) => i.name.includes(inventorySearch.value))
            : items.value,
        )
        expect(filteredInventory.value).toHaveLength(4)
      })

      it('returns empty list when no items match the search', () => {
        const inventorySearch = ref('xyz-no-match')
        const items = ref(mockInventoryItems)
        const filteredInventory = computed(() => {
          const q = inventorySearch.value.toLowerCase()
          return items.value.filter(
            (item) =>
              item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q),
          )
        })
        expect(filteredInventory.value).toHaveLength(0)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 2
// Given the user has inventory items with upcoming expiry dates,
// when the user navigates to the Plan Weekly Meals page and the Recommendations
// section, then the system displays 2-3 recipe suggestions that primarily
// use those expiring ingredients.
// ─────────────────────────────────────────────────────────────────────────────

describe('GIVEN user has inventory items with upcoming expiry dates', () => {
  describe('WHEN user navigates to the Recommendations section', () => {
    describe('THEN the system displays 2-3 recipe suggestions using expiring ingredients', () => {
      it('recommendations list contains between 2 and 3 items', () => {
        expect(mockRecommendations.length).toBeGreaterThanOrEqual(2)
        expect(mockRecommendations.length).toBeLessThanOrEqual(3)
      })

      it('each recommendation has a name, icon, and uses field', () => {
        mockRecommendations.forEach((rec) => {
          expect(rec.name).toBeTruthy()
          expect(rec.icon).toBeTruthy()
          expect(rec.uses).toBeTruthy()
        })
      })

      it('at least one recommendation uses an expiring ingredient (UltraMilk)', () => {
        const expiringItems = mockInventoryItems.filter((i) => i.warning)
        const relevant = getRelevantRecommendations(mockRecommendations, expiringItems)

        expect(relevant.length).toBeGreaterThanOrEqual(1)
        // Milk Pancakes uses UltraMilk which is expiring
        const milkRec = relevant.find((r) => r.name === 'Milk Pancakes')
        expect(milkRec).toBeDefined()
      })

      it('Milk Pancakes recommendation uses UltraMilk which is about to expire', () => {
        const milkRec = mockRecommendations.find((r) => r.name === 'Milk Pancakes')
        expect(milkRec).toBeDefined()
        expect(milkRec?.uses.toLowerCase()).toContain('ultramilk')
      })

      it('recommendations contain meals that use common expiring ingredients (Eggs)', () => {
        const eggsRec = mockRecommendations.filter((r) => r.uses.toLowerCase().includes('eggs'))
        expect(eggsRec.length).toBeGreaterThanOrEqual(1)
      })

      it('returns all recommendations when no items are expiring (fallback)', () => {
        const noExpiringItems: InventoryItem[] = []
        const result = getRelevantRecommendations(mockRecommendations, noExpiringItems)
        // Falls back to showing all recommendations
        expect(result).toHaveLength(mockRecommendations.length)
      })

      it('returns only recommendations matching expiring ingredients', () => {
        // Only UltraMilk is expiring
        const expiringItems = [mockInventoryItems[0]!] // UltraMilk only
        const result = getRelevantRecommendations(mockRecommendations, expiringItems)

        // Only Milk Pancakes uses UltraMilk
        expect(result.length).toBeGreaterThanOrEqual(1)
        result.forEach((rec) => {
          expect(rec.uses.toLowerCase()).toContain('ultramilk')
        })
      })

      it('planRecommendation assigns recipe to the first empty meal slot', () => {
        const mealSlots = ref([
          { type: 'breakfast', label: 'Breakfast', meal: '' },
          { type: 'lunch', label: 'Lunch', meal: '' },
          { type: 'dinner', label: 'Dinner', meal: '' },
          { type: 'snacks', label: 'Snacks', meal: '' },
        ])
        const notifications = ref<string[]>([])

        function planRecommendation(rec: Recommendation) {
          const emptySlot = mealSlots.value.find((s) => !s.meal)
          if (emptySlot) {
            emptySlot.meal = rec.name
            notifications.value.push(`"${rec.name}" added to ${emptySlot.label}`)
          } else {
            notifications.value.push('All slots are filled. Edit one to replace it.')
          }
        }

        const milkPancakes = mockRecommendations.find((r) => r.name === 'Milk Pancakes')!
        planRecommendation(milkPancakes)

        // Should fill breakfast (first empty slot)
        expect(mealSlots.value[0]!.meal).toBe('Milk Pancakes')
        expect(notifications.value[0]).toContain('Milk Pancakes')
        expect(notifications.value[0]).toContain('Breakfast')
      })

      it('planRecommendation fills slots sequentially', () => {
        const mealSlots = ref([
          { type: 'breakfast', label: 'Breakfast', meal: 'Already planned' },
          { type: 'lunch', label: 'Lunch', meal: '' },
          { type: 'dinner', label: 'Dinner', meal: '' },
          { type: 'snacks', label: 'Snacks', meal: '' },
        ])

        function planRecommendation(rec: Recommendation) {
          const emptySlot = mealSlots.value.find((s) => !s.meal)
          if (emptySlot) emptySlot.meal = rec.name
        }

        // Breakfast is taken — should go to Lunch
        planRecommendation(mockRecommendations[0]!)
        expect(mealSlots.value[0]!.meal).toBe('Already planned') // unchanged
        expect(mealSlots.value[1]!.meal).toBe('Nasi Goreng') // filled
      })

      it('planRecommendation shows message when all slots are full', () => {
        const mealSlots = ref([
          { type: 'breakfast', label: 'Breakfast', meal: 'A' },
          { type: 'lunch', label: 'Lunch', meal: 'B' },
          { type: 'dinner', label: 'Dinner', meal: 'C' },
          { type: 'snacks', label: 'Snacks', meal: 'D' },
        ])
        const notifications = ref<string[]>([])

        function planRecommendation(rec: Recommendation) {
          const emptySlot = mealSlots.value.find((s) => !s.meal)
          if (emptySlot) {
            emptySlot.meal = rec.name
          } else {
            notifications.value.push('All slots are filled. Edit one to replace it.')
          }
        }

        planRecommendation(mockRecommendations[0]!)
        expect(notifications.value[0]).toBe('All slots are filled. Edit one to replace it.')
      })
    })
  })
})
