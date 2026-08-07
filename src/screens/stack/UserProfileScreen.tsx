import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  useGetItemsQuery,
  useGetMyReservationsQuery,
  useGetReviewsByUserQuery,
  useGetUserByIdQuery,
} from '../../api/api';
import ItemCard from '../../components/ItemCard';
import { RootState } from '../../store';

const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

const getXPForNextLevel = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp);
  return currentLevel * 100;
};

const getLevelProgress = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  return Math.min((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel), 1);
};

const StarRating = ({ rating }: { rating: number }) => {
console.log('⭐ StarRating rating:', rating);  
const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.starContainer}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon key={`full-${i}`} name="star" size={18} color="#FFC107" />
      ))}
      {hasHalfStar && <Icon name="star-half" size={18} color="#FFC107" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon key={`empty-${i}`} name="star-outline" size={18} color="#FFC107" />
      ))}
    </View>
  );
};

export default function UserProfileScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
  } = useGetUserByIdQuery(id);

  const {
    data: reviews,
    isLoading: reviewsLoading,
  } = useGetReviewsByUserQuery(id);

  const { data: allItems, isLoading: itemsLoading } = useGetItemsQuery();
  const userItems = allItems?.filter((item) => item.ownerId === id) || [];

  const { data: myReservations, isLoading: reservationsLoading } =
    useGetMyReservationsQuery(currentUser?.id || '', {
      skip: !currentUser?.id,
    });

  const canRate = React.useMemo(() => {
    if (!currentUser || currentUser.id === id) return false;
    if (!myReservations) return false;

    return myReservations.some(
      (res) =>
        (res.userId === id || res.ownerId === id) &&
        res.status === 'končana' &&
        !res.rated
    );
  }, [myReservations, currentUser, id]);

  const getRateReservation = () => {
    if (!myReservations) return null;
    return myReservations.find(
      (res) =>
        (res.userId === id || res.ownerId === id) &&
        res.status === 'končana' &&
        !res.rated
    );
  };

  const handleRateUser = () => {
    const reservation = getRateReservation();
    if (!reservation) return;

    navigation.navigate('RateUser', {
      userId: id,
      reservationId: reservation.id,
      userName: user?.name || 'Uporabnik',
      itemTitle: 'Izmenjava',
    });
  };

  if (userLoading || reservationsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje profila...</Text>
      </View>
    );
  }

  if (userError || !user) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
        <Text style={styles.errorText}>Uporabnik ni najden.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Nazaj</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const xp = user.xp || 0;
  const level = user.level || getLevelFromXP(xp);
  const progress = getLevelProgress(xp);
  const xpForNextLevel = getXPForNextLevel(xp);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://picsum.photos/seed/user_' + id + '/100/100' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.name}</Text>

        
<View style={styles.ratingRow}>
  <StarRating rating={user.rating || 0} />
  <Text style={styles.ratingText}>
    ({user.reviewsCount || 0} {user.reviewsCount === 1 ? 'mnenje' : 'mnenj'})
  </Text>
</View>
       

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{userItems.length}</Text>
            <Text style={styles.statLabel}>📦 Oglasov</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{user.followers || 0}</Text>
            <Text style={styles.statLabel}>👥 Sledilcev</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{user.following || 0}</Text>
            <Text style={styles.statLabel}>👤 Sledi</Text>
          </View>
        </View>

        <View style={styles.levelContainer}>
          <View style={styles.xpRow}>
            <Text style={styles.xpText}>🏆 Level {level}</Text>
            <Text style={styles.xpText}>
              {xp} / {xpForNextLevel} XP
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress * 100, 100)}%` },
              ]}
            />
          </View>
        </View>

    

      <Text style={styles.sectionTitle}>📦 Oglasi uporabnika</Text>
      {itemsLoading ? (
        <ActivityIndicator size="small" color="#4CAF50" />
      ) : userItems.length > 0 ? (
        <FlatList
          data={userItems}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
              showLikeButton={true}
            />
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          style={styles.itemsList}
        />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Ta uporabnik še nima objavljenih oglasov.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>💬 Mnenja o uporabniku</Text>
      {reviewsLoading ? (
        <ActivityIndicator size="small" color="#4CAF50" />
      ) : reviews && reviews.length > 0 ? (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewUser}>{review.reviewerName || 'Uporabnik'}</Text>
              <View style={styles.reviewRating}>
                <StarRating rating={review.rating || 0} />
              </View>
            </View>
            {review.text && <Text style={styles.reviewText}>{review.text}</Text>}
            <Text style={styles.reviewDate}>
              {review.date ? new Date(review.date).toLocaleDateString('sl-SI') : ''}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Ta uporabnik še nima mnenj.</Text>
        </View>
      )}

      {currentUser && currentUser.id !== id && (
  <TouchableOpacity
    style={styles.writeReviewButton}
    onPress={() =>
      navigation.navigate('WriteReview', {
        userId: id,
        userName: user?.name || 'Uporabnik',
      })
    }
  >
    <Icon name="create-outline" size={20} color="#fff" />
    <Text style={styles.writeReviewButtonText}>Napiši mnenje</Text>
  </TouchableOpacity>
)}
</View>
    </ScrollView>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#ddd',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  starContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  levelContainer: {
    width: '100%',
    marginTop: 12,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  rateButton: {
    flexDirection: 'row',
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rateButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  itemsList: {
    paddingBottom: 4,
    width: '100%',

  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 6,
    minHeight: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  writeReviewButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#2196F3',
  paddingVertical: 12,
  borderRadius: 10,
  justifyContent: 'center',
  marginBottom: 12,
},
writeReviewButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 8,
},
});