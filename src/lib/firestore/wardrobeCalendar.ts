import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export type WardrobeCalendarDay = {
  id: string;
  ownerId: string;
  date: string;
  configNames: string[];
};

const calendarCollection = collection(db, "wardrobeCalendarDays");

const calendarDayId = (ownerId: string, date: string) => `${ownerId}_${date}`;
const sanitizeConfigNames = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean)
        .filter((entry, index, list) => list.indexOf(entry) === index)
    : [];

export function subscribeToWardrobeCalendarDays(
  ownerId: string,
  onChange: (days: WardrobeCalendarDay[]) => void
) {
  const calendarQuery = query(calendarCollection, where("ownerId", "==", ownerId));

  return onSnapshot(
    calendarQuery,
    (snapshot) => {
      const days = snapshot.docs
        .map((dayDoc) => {
          const data = dayDoc.data();
          return {
            id: dayDoc.id,
            ownerId: data.ownerId ?? ownerId,
            date: String(data.date ?? ""),
            configNames: sanitizeConfigNames(data.configNames),
          };
        })
        .filter((day) => day.date)
        .sort((a, b) => a.date.localeCompare(b.date));

      onChange(days);
    },
    (error) => {
      console.warn("Unable to subscribe to wardrobe calendar days", error);
      onChange([]);
    }
  );
}

export function subscribeToWardrobeCalendarDay(
  ownerId: string,
  date: string,
  onChange: (day: WardrobeCalendarDay) => void
) {
  const calendarQuery = query(
    calendarCollection,
    where("ownerId", "==", ownerId),
    where("date", "==", date)
  );

  return onSnapshot(
    calendarQuery,
    (snapshot) => {
      const dayDoc = snapshot.docs[0];
      const data = dayDoc?.data();
      onChange({
        id: dayDoc?.id ?? calendarDayId(ownerId, date),
        ownerId,
        date,
        configNames: sanitizeConfigNames(data?.configNames),
      });
    },
    (error) => {
      console.warn("Unable to subscribe to wardrobe calendar day", error);
      onChange({
        id: calendarDayId(ownerId, date),
        ownerId,
        date,
        configNames: [],
      });
    }
  );
}

export async function saveWardrobeCalendarDay(
  ownerId: string,
  date: string,
  configNames: string[]
) {
  await setDoc(
    doc(db, "wardrobeCalendarDays", calendarDayId(ownerId, date)),
    {
      ownerId,
      date,
      configNames: sanitizeConfigNames(configNames),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
