import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  useGetItemsQuery,
  useGetMyReservationsQuery,
} from '../../api/api';
import { db } from '../../config/firebase';
import { RootState } from '../../store';
import { isExpired } from '../../utils/timeUtils';


type RootStackParamList = {
  ItemDetail: { id: string };
  RateUser: { userId: string; reservationId: string; userName: string; itemTitle: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const calculateRemainingDays = (endDate: string): string => {
  if (!endDate) return 'Ni podatka';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  if (end.getTime() <= now.getTime()) {
    return '⏰ Izposoja je potekla!';
  }

  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 dan';
  if (diffDays < 7) return `${diffDays} dni`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    if (days === 0) return `${weeks} ${weeks === 1 ? 'teden' : 'tednov'}`;
    return `${weeks} ${weeks === 1 ? 'teden' : 'tednov'} in ${days} dni`;
  }
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  if (remainingDays === 0) return `${months} ${months === 1 ? 'mesec' : 'mesecev'}`;
  return `${months} ${months === 1 ? 'mesec' : 'mesecev'} in ${remainingDays} dni`;
};

export default function MyReservationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [expiredNotified, setExpiredNotified] = useState<string[]>([]);

  const {
    data: reservations,
    isLoading: reservationsLoading,
    isError: reservationsError,
    refetch: refetchReservations,
  } = useGetMyReservationsQuery(user?.id || '', {
    skip: !user?.id,
  });

  const {
    data: items,
    isLoading: itemsLoading,
  } = useGetItemsQuery();

  useEffect(() => {
    const checkExpired = () => {
      if (!reservations) return;
      const expired = reservations.filter(
        (res) =>
          res.status === 'aktivna' &&
          res.endDate &&
          isExpired(res.endDate) &&
          !expiredNotified.includes(res.id)
      );
      if (expired.length > 0) {
        const itemTitle = getItemTitle(expired[0].itemId);
        Alert.alert(
          '⏰ Izposoja je potekla!',
          `Izposoja za "${itemTitle}" je potekla.`,
          [{ text: 'V redu' }]
        );
        setExpiredNotified((prev) => [...prev, ...expired.map((r) => r.id)]);
      }
    };

    const interval = setInterval(checkExpired, 60000);
    checkExpired();
    return () => clearInterval(interval);
  }, [reservations]);

  const getItemDetails = (itemId: string) => {
    return items?.find((item) => item.id === itemId);
  };

  const getOwnerName = (itemId: string) => {
    const item = getItemDetails(itemId);
    return item?.ownerName || 'Neznan lastnik';
  };

  const getItemTitle = (itemId: string) => {
    const item = getItemDetails(itemId);
    return item?.title || 'Neznan predmet';
  };

  const getOwnerId = (itemId: string) => {
    const item = getItemDetails(itemId);
    return item?.ownerId || '';
  };

  const handleConfirmPickup = async (reservationId: string) => {
    Alert.alert(
      'Potrditev prevzema',
      'Ali si prepričan/a, da je uporabnik prevzel predmet?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Potrdi',
          onPress: async () => {
            try {
              const reservationRef = doc(db, 'reservations', reservationId);
              await updateDoc(reservationRef, {
                status: 'aktivna',
                confirmedAt: new Date().toISOString(),
              });
              Alert.alert('Uspeh', 'Prevzem je potrjen!');
              refetchReservations();
            } catch (error: any) {
              Alert.alert('Napaka', 'Potrditev ni uspela: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleCompleteReservation = async (reservationId: string) => {
    Alert.alert(
      'Potrditev zaključka',
      'Ali si prepričan/a, da je izmenjava zaključena?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Zaključi',
          onPress: async () => {
            try {
              const reservationRef = doc(db, 'reservations', reservationId);
              await updateDoc(reservationRef, {
                status: 'končana',
                completedAt: new Date().toISOString(),
              });
              Alert.alert('Uspeh', 'Izmenjava je zaključena!');
              refetchReservations();
            } catch (error: any) {
              Alert.alert('Napaka', 'Zaključek ni uspel: ' + error.message);
            }
          },
        },
      ]
    );
  };

  if (reservationsLoading || itemsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje rezervacij...</Text>
      </View>
    );
  }

  if (reservationsError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Napaka pri nalaganju rezervacij.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchReservations}>
          <Text style={styles.retryButtonText}>Poskusi znova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="calendar-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>Nimaš nobenih rezervacij</Text>
        <Text style={styles.emptySubtitle}>
          Ko boš rezerviral/a predmet, se bo pojavil tukaj.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Domov' as any)}
        >
          <Text style={styles.browseButtonText}>Razišči oglase</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderReservation = ({ item }: { item: any }) => {
    const itemTitle = getItemTitle(item.itemId);
    const ownerName = getOwnerName(item.itemId);
    const ownerId = getOwnerId(item.itemId);
    const isRated = item.rated || false;
    const isOwner = user?.id === ownerId;
    
    const displayEndDate = item.endDate?.includes('T') 
      ? item.endDate.split('T')[0] 
      : item.endDate;
    
    const expired = item.status === 'aktivna' && item.endDate && isExpired(item.endDate);

    const getStatusColor = () => {
      if (item.status === 'aktivna') {
        return expired ? '#d32f2f' : '#4CAF50';
      }
      if (item.status === 'potrjena') return '#FFC107';
      if (item.status === 'končana') return '#9E9E9E';
      return '#888';
    };

    const getStatusLabel = () => {
      if (item.status === 'aktivna') {
        return expired ? 'Potekla' : 'Aktivna';
      }
      if (item.status === 'potrjena') return 'Potrjena';
      if (item.status === 'končana') return 'Končana';
      return item.status;
    };

    return (
      <TouchableOpacity
        style={[styles.reservationCard, expired && styles.expiredCard]}
        onPress={() =>
          navigation.navigate('ItemDetail', { id: item.itemId })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {itemTitle}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel()}</Text>
          </View>
        </View>

        <Text style={styles.ownerName}>
          👤 {isOwner ? 'Tvoj predmet' : `Lastnik: ${ownerName}`}
        </Text>

        <View style={styles.dateContainer}>
          <Icon name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateLabel}>Od:</Text>
          <Text style={styles.dateValue}>{item.startDate}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Icon name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateLabel}>Do:</Text>
          <Text style={styles.dateValue}>{displayEndDate}</Text>
        </View>

        {item.status !== 'končana' && item.endDate && (
          <View style={styles.timeContainer}>
            {expired ? (
              <View style={styles.expiredContainer}>
                <Icon name="alert-circle" size={20} color="#d32f2f" />
                <Text style={styles.expiredText}>⏰ Izposoja je potekla!</Text>
              </View>
            ) : (
              <Text style={styles.remainingTime}>
                ⏳ Preostal čas: {calculateRemainingDays(item.endDate)}
              </Text>
            )}
          </View>
        )}

        {isOwner && item.status === 'potrjena' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleConfirmPickup(item.id)}
          >
            <Icon name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Potrdi prevzem</Text>
          </TouchableOpacity>
        )}

        {isOwner && item.status === 'aktivna' && !expired && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonComplete]}
            onPress={() => handleCompleteReservation(item.id)}
          >
            <Icon name="flag-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Zaključi izmenjavo</Text>
          </TouchableOpacity>
        )}

        {item.status === 'končana' && !isRated && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() =>
              navigation.navigate('RateUser', {
                userId: item.ownerId || item.userId,
                reservationId: item.id,
                userName: ownerName,
                itemTitle: itemTitle,
              })
            }
          >
            <Icon name="star" size={16} color="#1a1a1a" />
            <Text style={styles.rateButtonText}>Oceni uporabnika</Text>
          </TouchableOpacity>
        )}

        {item.status === 'končana' && isRated && (
          <View style={styles.alreadyRatedContainer}>
            <Icon name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.alreadyRatedText}>Že ocenjeno</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() =>
            navigation.navigate('ItemDetail', { id: item.itemId })
          }
        >
          <Text style={styles.detailButtonText}>Poglej oglas</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={reservationsLoading}
            onRefresh={refetchReservations}
          />
        }
      />
    </View>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
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
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  expiredCard: {
    borderColor: '#d32f2f',
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
    width: 30,
  },
  dateValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  timeContainer: {
    marginTop: 8,
  },
  remainingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  actionButtonComplete: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  rateButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  alreadyRatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  alreadyRatedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  detailButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
