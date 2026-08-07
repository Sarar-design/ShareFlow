import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const findOrCreateChat = async (
  userId: string,
  otherUserId: string,
  itemId?: string
): Promise<string> => {
  console.log('findOrCreateChat klican:', { userId, otherUserId, itemId });

  if (!userId || !otherUserId) {
    throw new Error('Manjkajo ID-ji uporabnikov.');
  }

  
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId)
  );
  const querySnapshot = await getDocs(q);

  let existingChatId: string | null = null;

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const participants = data.participants || [];
    if (
      participants.includes(userId) &&
      participants.includes(otherUserId)
    ) {
      if (itemId) {
        if (data.itemId === itemId) {
          existingChatId = doc.id;
        }
      } else {
        existingChatId = doc.id;
      }
    }
  });

  if (existingChatId) {
    console.log('Obstoječi klepet najden:', existingChatId);
    return existingChatId;
  }

  
  console.log('Ustvarjam nov klepet...');
  const newChat = {
    participants: [userId, otherUserId],
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    itemId: itemId || '',
    unreadCount: {
      [userId]: 0,
      [otherUserId]: 0,
    },
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'chats'), newChat);
  console.log('Nov klepet ustvarjen, ID:', docRef.id);
  return docRef.id;
};