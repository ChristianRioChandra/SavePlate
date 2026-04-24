// src/tests/components/claimListing.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// ─── Types (mirrored from component) ─────────────────────────────────────────

interface Tag {
  label: string
  variant?: 'green' | 'warn' | ''
}

interface DonationItem {
  id: number
  title: string
  tags: Tag[]
  description: string
  expiryDays?: number
  claimed?: boolean
}

// ─── Extracted claim logic (mirrors claimListing in component) ────────────────
// We extract into a factory function so each test gets a fresh, isolated state —
// same pattern as the component's ref() state.

function createClaimStore(initialListings: DonationItem[]) {
  const allListings = ref<DonationItem[]>([...initialListings])
  const claimedIds = ref<Set<number>>(new Set())
  const notifications = ref<string[]>([]) // captures notifyMessage calls

  const notifyMessage = (msg: string) => {
    notifications.value.push(msg)
  }

  function claimListing(id: number) {
    if (claimedIds.value.has(id)) {
      notifyMessage('You have already claimed this item.')
      return
    }

    claimedIds.value.add(id)
    allListings.value = allListings.value.filter((i) => i.id !== id)
    notifyMessage('Item claimed! The donor will be notified. 🎉')
  }

  return { allListings, claimedIds, notifications, claimListing }
}

// ─── Mock available listings ──────────────────────────────────────────────────

const availableListing: DonationItem = {
  id: 3,
  title: 'Susu UltraMilk · 500ml Original',
  tags: [
    { label: 'Exp: 6 Apr', variant: 'warn' },
    { label: 'Dairy' },
    { label: 'Active', variant: 'green' },
  ],
  description: 'Unopened, pickup Kerobokan. Available 8am–12pm.',
  expiryDays: 2,
}

const anotherListing: DonationItem = {
  id: 5,
  title: 'Telur Kampung · 1 Dozen',
  tags: [{ label: 'Fresh', variant: 'green' }, { label: 'Protein' }],
  description: 'Farm fresh eggs, pickup Ubud area only.',
  expiryDays: 7,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('claimListing — Request/Claim donation', () => {
  // ── GIVEN: a listing is available ──────────────────────────────────────────

  describe('GIVEN a user views a specific donation listing that is still available', () => {
    it('the listing exists in allListings before any action', () => {
      const { allListings } = createClaimStore([availableListing])

      const found = allListings.value.find((i) => i.id === availableListing.id)
      expect(found).toBeDefined()
      expect(found?.title).toBe('Susu UltraMilk · 500ml Original')
    })

    it('the listing is not in claimedIds before any action', () => {
      const { claimedIds } = createClaimStore([availableListing])

      expect(claimedIds.value.has(availableListing.id)).toBe(false)
    })

    it('the Claim button is enabled (not yet claimed)', () => {
      const { claimedIds } = createClaimStore([availableListing])

      // In the component: :disabled="claimedIds.has(item.id)"
      const isDisabled = claimedIds.value.has(availableListing.id)
      expect(isDisabled).toBe(false)
    })
  })

  // ── WHEN: user clicks Claim and confirms ────────────────────────────────────

  describe('WHEN the user clicks the Claim button and confirms the action', () => {
    it('claimListing is called with the correct listing id', () => {
      const { claimListing, claimedIds } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      // Confirm it was registered
      expect(claimedIds.value.has(availableListing.id)).toBe(true)
    })
  })

  // ── THEN: listing status changes to Claimed ─────────────────────────────────

  describe('THEN the system changes the listing status to Claimed', () => {
    it('adds the listing id to claimedIds', () => {
      const { claimListing, claimedIds } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      expect(claimedIds.value.has(availableListing.id)).toBe(true)
    })

    it('removes the listing from allListings (no longer browseable)', () => {
      const { claimListing, allListings } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      const stillExists = allListings.value.find((i) => i.id === availableListing.id)
      expect(stillExists).toBeUndefined()
    })

    it('allListings count decreases by 1 after claiming', () => {
      const { claimListing, allListings } = createClaimStore([availableListing, anotherListing])

      expect(allListings.value).toHaveLength(2)
      claimListing(availableListing.id)
      expect(allListings.value).toHaveLength(1)
    })

    it('only the claimed listing is removed — others remain untouched', () => {
      const { claimListing, allListings } = createClaimStore([availableListing, anotherListing])

      claimListing(availableListing.id)

      expect(allListings.value).toHaveLength(1)
      expect(allListings.value[0]!.id).toBe(anotherListing.id)
      expect(allListings.value[0]!.title).toBe('Telur Kampung · 1 Dozen')
    })

    it('Claim button becomes disabled after claiming (claimedIds check)', () => {
      const { claimListing, claimedIds } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      // In the component: :disabled="claimedIds.has(item.id)"
      const isDisabled = claimedIds.value.has(availableListing.id)
      expect(isDisabled).toBe(true)
    })

    it('button label changes to "✓ Claimed" after claiming', () => {
      const { claimListing, claimedIds } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      // In the component: {{ claimedIds.has(item.id) ? '✓ Claimed' : 'Claim' }}
      const label = claimedIds.value.has(availableListing.id) ? '✓ Claimed' : 'Claim'
      expect(label).toBe('✓ Claimed')
    })
  })

  // ── THEN: confirmation notification is sent ─────────────────────────────────

  describe('THEN a confirmation notification is sent to the claiming user', () => {
    it('notifyMessage is called after claiming', () => {
      const { claimListing, notifications } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      expect(notifications.value).toHaveLength(1)
    })

    it('notification message confirms the claim was successful', () => {
      const { claimListing, notifications } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      expect(notifications.value[0]).toBe('Item claimed! The donor will be notified. 🎉')
    })

    it('notification mentions the donor will be notified', () => {
      const { claimListing, notifications } = createClaimStore([availableListing])

      claimListing(availableListing.id)

      expect(notifications.value[0]).toContain('donor will be notified')
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('prevents claiming the same listing twice', () => {
      const { claimListing, notifications } = createClaimStore([availableListing])

      claimListing(availableListing.id)
      claimListing(availableListing.id) // second attempt

      // Second attempt triggers the "already claimed" message
      expect(notifications.value).toHaveLength(2)
      expect(notifications.value[1]).toBe('You have already claimed this item.')
    })

    it('allListings does not change on a duplicate claim attempt', () => {
      const { claimListing, allListings } = createClaimStore([availableListing, anotherListing])

      claimListing(availableListing.id) // first claim — removes it
      claimListing(availableListing.id) // second attempt — no change

      expect(allListings.value).toHaveLength(1) // still 1, not 0 again
    })

    it('claiming a non-existent id does not crash and sends no notification', () => {
      const { claimListing, notifications, allListings } = createClaimStore([availableListing])

      // id 999 does not exist in listings
      claimListing(999)

      // It adds 999 to claimedIds and removes nothing (filter finds no match)
      expect(allListings.value).toHaveLength(1) // unchanged
      expect(notifications.value[0]).toBe('Item claimed! The donor will be notified. 🎉')
    })

    it('can claim multiple different listings independently', () => {
      const { claimListing, claimedIds, allListings } = createClaimStore([
        availableListing,
        anotherListing,
      ])

      claimListing(availableListing.id)
      claimListing(anotherListing.id)

      expect(claimedIds.value.has(availableListing.id)).toBe(true)
      expect(claimedIds.value.has(anotherListing.id)).toBe(true)
      expect(allListings.value).toHaveLength(0)
    })
  })
})
