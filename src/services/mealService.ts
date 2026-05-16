import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  FieldValue,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const MEAL_PLANS_COL = 'meal_plans'

export interface MealSlot {
  type: string
  label: string
  meal: string
}

export interface MealPlan {
  user_id: string
  date: string // YYYY-MM-DD
  slots: MealSlot[]
  ingredients?: { name: string, icon: string }[]
  updated_at: FieldValue | Timestamp
}

/**
 * Saves or updates a meal plan for a specific date and user.
 */
export async function saveMealPlan(
  uid: string,
  date: string,
  slots: MealSlot[],
  ingredients: { name: string, icon: string }[] = []
): Promise<void> {
  const docId = `${uid}_${date}`
  const docRef = doc(db, MEAL_PLANS_COL, docId)

  await setDoc(docRef, {
    user_id: uid,
    date,
    slots,
    ingredients,
    updated_at: serverTimestamp(),
  }, { merge: true })
}

/**
 * Retrieves a meal plan for a specific date and user.
 */
export async function getMealPlan(
  uid: string,
  date: string
): Promise<MealPlan | null> {
  const docId = `${uid}_${date}`
  const docRef = doc(db, MEAL_PLANS_COL, docId)
  const snap = await getDoc(docRef)

  if (snap.exists()) {
    return snap.data() as MealPlan
  }
  return null
}

/**
 * Retrieves all meal plans for a user in a specific month/year.
 * Useful for calendar indicators.
 */
export async function getUserMealPlansForMonth(
  uid: string,
  year: number,
  month: number
): Promise<MealPlan[]> {
  // Start and end of month
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = `${year}-${String(month + 1).padStart(2, '0')}-31`

  const q = query(
    collection(db, MEAL_PLANS_COL),
    where('user_id', '==', uid),
    where('date', '>=', start),
    where('date', '<=', end)
  )

  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as MealPlan)
}
