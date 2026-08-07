import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event, Item, Reservation, Review, User } from '../types';


const convertDoc = <T,>(doc: DocumentData): T => {
  return { id: doc.id, ...doc.data() } as T;
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

    createReservation: builder.mutation<Reservation, Partial<Reservation>>({
      queryFn: async (newRes: Partial<Reservation>) => {
        try {
          if (!newRes.itemId || !newRes.userId) {
            return { error: { status: 400, data: 'Manjkajo podatki' } };
          }
          const fullRes = {
            itemId: newRes.itemId,
            userId: newRes.userId,
            status: 'potrjena',
            startDate: newRes.startDate || new Date().toISOString().split('T')[0],
            endDate: newRes.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            qrCode: `QR_${Math.random().toString(36).substring(7)}`,
            remainingTime: '7 dni',
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
          const q = query(collection(db, 'reviews'), where('userId', '==', userId));
          const querySnapshot = await getDocs(q);
          const reviews = querySnapshot.docs.map((doc) => convertDoc<Review>(doc));
          return { data: reviews };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
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
  useCreateReservationMutation,
  useGetReviewsByUserQuery,
} = api;