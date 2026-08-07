import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { db } from '../../config/firebase';
import { RootState } from '../../store';

type RouteParams = {
  userId: string;
  reservationId: string;
  userName: string;
  itemTitle: string;
};

export default function RateUserScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { userId, reservationId, userName, itemTitle } = route.params as RouteParams;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Napaka', 'Izberi oceno (1-5 zvezdic).');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: userId, 
        reviewerId: user?.id,
        reviewerName: user?.name || 'Uporabnik',
        reservationId: reservationId,
        rating: rating,
        text: comment.trim() || '',
        createdAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentRating = userData.rating || 0;
        const currentCount = userData.reviewsCount || 0;
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;
        
        await updateDoc(userRef, {
          rating: newRating,
          reviewsCount: newCount,
        });
      }

      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        rated: true,
      });

      Alert.alert('Uspeh', 'Hvala za oceno!', [
        { text: 'V redu', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Napaka', 'Ocene ni bilo mogoče shraniti: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Icon
            name={i <= rating ? 'star' : 'star-outline'}
            size={40}
            color={i <= rating ? '#FFC107' : '#ccc'}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oceni uporabnika</Text>
      <Text style={styles.subtitle}>
        Kako bi ocenil/a {userName || 'uporabnika'} za izmenjavo "{itemTitle || 'predmeta'}"?
      </Text>

      <View style={styles.starsContainer}>{renderStars()}</View>
      <Text style={styles.ratingLabel}>
        {rating === 0 ? 'Izberi oceno' : `Ocena: ${rating} / 5`}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Dodaj komentar (opcijsko)..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={500}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Objavi oceno</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
        <Text style={styles.skipButtonText}>Preskoči</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
});