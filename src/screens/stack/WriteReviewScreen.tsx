import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
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
  userName: string;
};

export default function WriteReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useSelector((state: RootState) => state.auth);
  const { userId, userName } = route.params as RouteParams;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Napaka', 'Izberi oceno (1–5 zvezdic).');
      return;
    }

    if (rating <= 2 && comment.trim() === '') {
      Alert.alert('Napaka', 'Za tako nizko oceno dodaj komentar.');
      return;
    }

    if (!user) {
      Alert.alert('Napaka', 'Za pisanje mnenja se moraš prijaviti.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: userId,
        reviewerId: user.id,
        reviewerName: user.name || 'Uporabnik',
        reservationId: null, 
        rating: rating,
        text: comment.trim() || '',
        createdAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const oldRating = data?.rating || 0;
        const oldCount = data?.reviewsCount || 0;
        const newCount = oldCount + 1;
        const newRating = ((oldRating * oldCount) + rating) / newCount;

        await updateDoc(userRef, {
          rating: Number(newRating.toFixed(2)),
          reviewsCount: newCount,
        });
      }

      Alert.alert('Uspeh', 'Hvala za tvoje mnenje! 🎉', [
        { text: 'V redu', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Napaka', 'Mnenja ni bilo mogoče shraniti: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={loading}>
          <Icon
            name={i <= rating ? 'star' : 'star-outline'}
            size={44}
            color={i <= rating ? '#FFC107' : '#ccc'}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Napiši mnenje</Text>
      <Text style={styles.subtitle}>
        Kako bi ocenil/a uporabnika <Text style={styles.userNameHighlight}>{userName}</Text>?
      </Text>

      <View style={styles.starsContainer}>{renderStars()}</View>
      <Text style={styles.ratingLabel}>
        {rating === 0 ? 'Tapni za izbiro ocene' : `Ocena: ${rating} / 5`}
      </Text>

      <Text style={styles.commentLabel}>
        Tvoje mnenje {rating <= 2 && <Text style={styles.requiredStar}>*</Text>}
        {rating <= 2 && (
          <Text style={styles.commentRequired}> (obvezno za nizko oceno)</Text>
        )}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Napiši svoje mnenje o uporabniku..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={500}
        editable={!loading}
      />
      <Text style={styles.charCount}>{comment.length}/500</Text>

      <TouchableOpacity
        style={[styles.submitButton, (loading || rating === 0) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading || rating === 0}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Objavi mnenje</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.skipButtonText}>Prekliči</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  userNameHighlight: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starIcon: {
    marginHorizontal: 6,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#d32f2f',
    fontSize: 18,
  },
  commentRequired: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fafafa',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 16,
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
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
});