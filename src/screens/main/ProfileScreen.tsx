import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useGetItemsQuery, useGetMyReservationsQuery } from '../../api/api';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';

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
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
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

export default function ProfileScreen({ navigation }: any) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const { data: reservations } = useGetMyReservationsQuery(user?.id || '', {
    skip: !user?.id,
  });
  const { data: allItems, isLoading: itemsLoading } = useGetItemsQuery();

  const activeItemsCount = allItems?.filter(
    (item) => item.ownerId === user?.id && item.status !== 'archived'
  ).length || 0;

  const xp = user?.xp || 0;
  const level = user?.level || getLevelFromXP(xp);
  const progress = getLevelProgress(xp);
  const xpForNextLevel = getXPForNextLevel(xp);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Nalaganje profila...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://picsum.photos/seed/profile_' + user.id + '/100/100' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.name}</Text>

        <View style={styles.ratingRow}>
          <StarRating rating={user.rating || 0} />
          <Text style={styles.ratingText}>
            ({user.reviewsCount || 0} {user.reviewsCount === 1 ? 'mnenje' : 'mnenj'})
          </Text>
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

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{activeItemsCount}</Text>
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
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('UserProfile', { id: user.id })}
      >
        <Text style={styles.menuText}>👤 Moj profil (ogled)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('MyItems' as never)}
      >
        <Text style={styles.menuText}>📋 Moji oglasi ({activeItemsCount})</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('Likes' as never)}
      >
        <Text style={styles.menuText}>❤️ Všečki</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('MyReservations' as never)}
      >
        <Text style={styles.menuText}>
          📅 Tvoje rezervacije ({reservations?.length || 0})
        </Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={[styles.menuItem, styles.logout]}
        onPress={() => dispatch(logout())}
      >
        <Text style={[styles.menuText, { color: 'red' }]}>Odjava</Text>
      </TouchableOpacity>
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
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
    paddingLeft: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  logout: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

});