import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../config/firebase';
import { RootState } from '../store';

export function useLike(itemId: string) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  
  const checkIfLiked = async () => {
    if (!user?.id || !itemId) {
      setLoading(false);
      return;
    }

    try {
      const likeRef = doc(db, 'users', user.id, 'likes', itemId);
      const likeSnap = await getDoc(likeRef);
      setIsLiked(likeSnap.exists());
    } catch (error) {
      console.error('Napaka pri preverjanju všečka:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const fetchLikesCount = async () => {
    if (!itemId) return;

    try {
      
      const itemRef = doc(db, 'items', itemId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const data = itemSnap.data();
        setLikesCount(data.likesCount || 0);
      }

      
    } catch (error) {
      console.error('Napaka pri pridobivanju števila všečkov:', error);
    }
  };

  useEffect(() => {
    if (itemId) {
      checkIfLiked();
      fetchLikesCount();
    }
  }, [itemId, user?.id]);

  
  const toggleLike = async () => {
    if (!user?.id) {
      alert('Za všečkanje se moraš prijaviti.');
      return;
    }

    try {
      const likeRef = doc(db, 'users', user.id, 'likes', itemId);
      const itemRef = doc(db, 'items', itemId);

      if (isLiked) {
        
        await deleteDoc(likeRef);
        await updateDoc(itemRef, {
          likesCount: increment(-1),
        });
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        
        await setDoc(likeRef, {
          itemId,
          likedAt: new Date().toISOString(),
        });
        await updateDoc(itemRef, {
          likesCount: increment(1),
        });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Napaka pri preklopu všečka:', error);
      alert('Napaka: ' + error.message);
    }
  };

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike,
  };
}