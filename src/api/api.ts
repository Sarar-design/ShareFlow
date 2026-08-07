import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event, Item, Reservation, Review, User } from '../types';
import { parseRentalPeriodToDays } from '../utils/timeUtils';

const convertDoc = <T,>(docSnap: DocumentData): T => {
  const data = docSnap.data();
  const result: any = { id: docSnap.id, ...data };
  Object.keys(result).forEach((key) => {
    const value = result[key];
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && value.type === 'firestore/timestamp/1.0') {
      result[key] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
    } else if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
      result[key] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
    }
  });
  return result as T;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Items', 'Reservations', 'Users'],
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      queryFn: async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'items'));
          const items = querySnapshot.docs.map((doc) => convertDoc<Item>(doc));
          return { data: items };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ['Items'],
    }),
    getItemById: builder.query<Item, string>({
      queryFn: async (id: string) => {
        try {
          const docSnap = await getDoc(doc(db, 'items', id));
          if (!docSnap.exists()) {
            return { error: { status: 404, data: 'Artikel ni najden' } };
          }
          return { data: convertDoc<Item>(docSnap) };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'Items', id }],
    }),
    getItemsByCategory: builder.query<Item[], string>({
      queryFn: async (category: string) => {
        try {
          const q = query(collection(db, 'items'), where('category', '==', category));
          const querySnapshot = await getDocs(q);
          const items = querySnapshot.docs.map((doc) => convertDoc<Item>(doc));
          return { data: items };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),

    getEvents: builder.query<Event[], void>({
      queryFn: async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'events'));
          const events = querySnapshot.docs.map((doc) => convertDoc<Event>(doc));
          return { data: events };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),
    getEventById: builder.query<Event, string>({
      queryFn: async (id: string) => {
        try {
          const docSnap = await getDoc(doc(db, 'events', id));
          if (!docSnap.exists()) {
            return { error: { status: 404, data: 'Dogodek ni najden' } };
          }
          return { data: convertDoc<Event>(docSnap) };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),

    getUserById: builder.query<User, string>({
      queryFn: async (id: string) => {
        try {
          const docSnap = await getDoc(doc(db, 'users', id));
          if (!docSnap.exists()) {
            return { error: { status: 404, data: 'Uporabnik ni najden' } };
          }
          return { data: convertDoc<User>(docSnap) };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),

    getMyReservations: builder.query<Reservation[], string>({
      queryFn: async (userId: string) => {
        try {
          const q = query(collection(db, 'reservations'), where('userId', '==', userId));
          const querySnapshot = await getDocs(q);
          const reservations = querySnapshot.docs.map((doc) => convertDoc<Reservation>(doc));
          return { data: reservations };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ['Reservations'],
    }),

    getReservationsByItem: builder.query<Reservation[], string>({
  queryFn: async (itemId: string) => {
    try {
      const q = query(collection(db, 'reservations'), where('itemId', '==', itemId));
      const querySnapshot = await getDocs(q);
      const reservations = querySnapshot.docs.map((doc) => convertDoc<Reservation>(doc));
      return { data: reservations };
    } catch (error: any) {
      return { error: { status: 500, data: error.message } };
    }
  },
  providesTags: ['Reservations'],
}),

    createReservation: builder.mutation<Reservation, Partial<Reservation>>({
      queryFn: async (newRes: Partial<Reservation>) => {
        try {
          if (!newRes.itemId || !newRes.userId) {
            return { error: { status: 400, data: 'Manjkajo podatki' } };
          }
          const itemRef = doc(db, 'items', newRes.itemId);
          const itemSnap = await getDoc(itemRef);
          let ownerId = '';
          let rentalPeriod = '7 dni';
          if (itemSnap.exists()) {
            const data = itemSnap.data();
            ownerId = data.ownerId || '';
            rentalPeriod = data.rentalPeriod || '7 dni';
          }
          let endDateStr: string;
          if (newRes.endDate) {
            endDateStr = newRes.endDate.includes('T') ? newRes.endDate.split('T')[0] : newRes.endDate;
          } else {
            const rentalDays = parseRentalPeriodToDays(rentalPeriod);
            const startDate = newRes.startDate ? new Date(newRes.startDate) : new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + rentalDays);
            endDateStr = endDate.toISOString().split('T')[0];
          }
          const fullRes = {
            itemId: newRes.itemId,
            userId: newRes.userId,
            ownerId,
            status: 'potrjena',
            startDate: newRes.startDate || new Date().toISOString().split('T')[0],
            endDate: endDateStr,
            qrCode: `RES_${Math.random().toString(36).substring(7).toUpperCase()}`,
            remainingTime: '',
            rated: false,
            createdAt: new Date().toISOString(),
          };
          const docRef = await addDoc(collection(db, 'reservations'), fullRes);
          return { data: { id: docRef.id, ...fullRes } as Reservation };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ['Reservations'],
    }),

    getReviewsByUser: builder.query<Review[], string>({
      queryFn: async (userId: string) => {
        try {
          const q = query(
            collection(db, 'reviews'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const reviews = querySnapshot.docs.map((doc) => convertDoc<Review>(doc));
          return { data: reviews };
        } catch (error: any) {
          if (error.message?.includes('index')) {
            const q = query(collection(db, 'reviews'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            const reviews = querySnapshot.docs.map((doc) => convertDoc<Review>(doc));
            return { data: reviews };
          }
          return { error: { status: 500, data: error.message } };
        }
      },
    }),

    getLikedItems: builder.query<string[], string>({
      queryFn: async (userId: string) => {
        try {
          const likesRef = collection(db, 'users', userId, 'likes');
          const likesSnap = await getDocs(likesRef);
          const ids = likesSnap.docs.map((doc) => doc.id);
          return { data: ids };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ['Items'],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useGetItemsByCategoryQuery,
  useGetEventsQuery,
  useGetEventByIdQuery,
  useGetUserByIdQuery,
  useGetMyReservationsQuery,
  useGetReservationsByItemQuery,
  useCreateReservationMutation,
  useGetReviewsByUserQuery,
  useGetLikedItemsQuery,
} = api;