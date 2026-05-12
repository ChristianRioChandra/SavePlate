## Firestore Rules Analysis

Project: `saveplate-9b8c6`

### Collections observed in code

- `users`
  - doc id: Firebase Auth UID
  - create: registration
  - read/update: owner only
  - fields:
    - `name`
    - `email`
    - `householdSize`
    - `is_verified`
    - `two_factor_enabled`
    - `privacy_settings`
    - `inventory_ui_prefs`
    - `created_at`

- `food`
  - create/read/update/delete by owner
  - queries:
    - `where('user_id', '==', uid).orderBy('expiry_date', 'asc')`
    - `where('user_id', '==', uid).where('status', '==', ...).orderBy('expiry_date', 'asc')`
    - `where('user_id', '==', uid).where('expiry_date', '>=', ...).where('expiry_date', '<=', ...).orderBy('expiry_date', 'asc')`
    - `where('user_id', '==', uid).orderBy('created_at', 'asc')`
  - fields:
    - `user_id`
    - `food_type`
    - `name`
    - `quantity`
    - `unit`
    - `expiry_date`
    - `type`
    - `storage_location`
    - `notes`
    - `status`
    - `quantity_level`
    - `reserved_quantity`
    - `created_at`
    - optional analytics field observed in queries: `category_id`

- `mealPlans`
  - create/read/update/delete by owner
  - queries:
    - `where('user_id', '==', uid).orderBy('date', 'asc')`
    - `where('user_id', '==', uid).where('date', '==', date)`
  - subcollection: `mealPlans/{mealPlanId}/mealPlanItems`
    - create/read/update/delete by parent owner

- `notifications`
  - create by app logic
  - read/update by owner
  - queries:
    - `where('user_id', '==', uid).orderBy('created_at', 'desc')`
    - `where('user_id', '==', uid).where('is_read', '==', false).orderBy('created_at', 'desc')`

- `donationListings`
  - create by owner
  - public-in-app authenticated browsing of active listings
  - owner can read/update own listings
  - queries:
    - `where('status', '==', 'active').orderBy('expiry_date', 'asc')`
    - `where('user_id', '==', uid).orderBy('created_at', 'desc')`

- `donationRequests`
  - create by claiming user
  - readable by claiming user and listing owner
  - updates by listing owner to confirm/reject
  - queries:
    - `where('listing_id', '==', listingId).orderBy('requested_at', 'desc')`
    - `where('claimer_user_id', '==', uid).orderBy('requested_at', 'desc')`

- `categories`
  - app-wide category list
  - currently no owner field
  - low-confidence design; safest rules are authenticated read and authenticated schema-limited writes if needed

### Main security assumptions

- All app access is authenticated.
- `users` contains private data and must remain owner-only.
- `food`, `mealPlans`, `notifications` are owner-only.
- `donationListings` may be readable by any authenticated user only when status is `active`; owners may still read their own non-active listings.
- `donationRequests` are visible to the claimer and to the owner of the related listing.
