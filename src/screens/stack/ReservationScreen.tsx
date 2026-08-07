import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { Calendar } from 'react-native-calendars';
import { useSelector } from 'react-redux';
import {
  useCreateReservationMutation,
  useGetItemByIdQuery,
  useGetMyReservationsQuery,
} from '../../api/api';
import { RootState } from '../../store';
import { isExpired, parseRentalPeriodToDays } from '../../utils/timeUtils';

const calculateRemainingDays = (endDate: string): string => {
  if (!endDate) return 'Ni podatka';
  
  const now = new Date();
  const end = new Date(endDate);
  
  if (end.getTime() <= now.getTime()) {
    return '⏰ Izposoja je potekla!';
  }

  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
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

const getDateRange = (startDate: string, days: number): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDuration = (days: number): string => {
  if (days === 1) return '1 dan';
  if (days < 7) return `${days} dni`;
  if (days === 7) return '1 teden';
  if (days < 14) return `${days} dni`;
  if (days === 14) return '2 tedna';
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainder = days % 7;
    if (remainder === 0) return `${weeks} tednov`;
    return `${weeks} tednov in ${remainder} dni`;
  }
  const months = Math.floor(days / 30);
  const remainder = days % 30;
  if (remainder === 0) return `${months} mesec${months > 1 ? 'ev' : ''}`;
  return `${months} mesec${months > 1 ? 'ev' : ''} in ${remainder} dni`;
};

export default function ReservationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { itemId } = route.params as { itemId: string };
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(1); // privzeto 1 dan

  const { data: item, isLoading: itemLoading } = useGetItemByIdQuery(itemId);
  const { data: myReservations, refetch: refetchReservations } =
    useGetMyReservationsQuery(user?.id || '', {
      skip: !user?.id,
    });

  const [createReservation, { data: newReservation, isLoading: isCreating }] =
    useCreateReservationMutation();

  const activeReservation = myReservations?.find(
    (res) => res.itemId === itemId && res.status === 'aktivna'
  );
  const isActiveExpired = activeReservation?.endDate
    ? isExpired(activeReservation.endDate)
    : false;

  const maxDays = item?.rentalPeriod ? parseRentalPeriodToDays(item.rentalPeriod) : 7;

  React.useEffect(() => {
    if (durationDays > maxDays) setDurationDays(maxDays);
  }, [maxDays]);

  const getMarkedDates = () => {
    if (!selectedDate) return {};
    const range = getDateRange(selectedDate, durationDays);
    const marked: any = {};
    range.forEach((date, index) => {
      marked[date] = {
        selected: true,
        selectedColor: '#4CAF50',
        startingDay: index === 0,
        endingDay: index === range.length - 1,
      };
    });
    return marked;
  };

  const handleReserve = async () => {
    if (!user) {
      Alert.alert('Napaka', 'Nisi prijavljen.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Napaka', 'Izberi datum.');
      return;
    }
    if (durationDays < 1) {
      Alert.alert('Napaka', 'Izberi vsaj 1 dan izposoje.');
      return;
    }
    if (durationDays > maxDays) {
      Alert.alert('Napaka', `Največja dovoljena izposoja je ${maxDays} dni.`);
      return;
    }

    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    const endDateStr = end.toISOString().split('T')[0];

    try {
      await createReservation({
        itemId,
        userId: user.id,
        startDate: selectedDate,
        endDate: endDateStr,
      }).unwrap();
      refetchReservations();
      Alert.alert('Uspeh', 'Rezervacija je bila ustvarjena!');
    } catch (error: any) {
      Alert.alert('Napaka', error?.data || 'Rezervacija ni uspela.');
    }
  };

  if (itemLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje podrobnosti...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
        <Text style={styles.errorText}>Predmet ni najden.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Nazaj</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (item.type === 'prodaja') {
    return (
      <View style={styles.centerContainer}>
        <Icon name="cash-outline" size={60} color="#4CAF50" />
        <Text style={styles.errorText}>Ta oglas je namenjen prodaji.</Text>
        <Text style={styles.subText}>Za nakup kontaktiraj lastnika.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Nazaj</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (newReservation) {
    return (
      <View style={styles.container}>
        <Text style={styles.confirmTitle}>✅ Rezervacija je potrjena!</Text>
        <Text style={styles.confirmSubtitle}>
          Lastnik bo potrdil prevzem, ko bo predmet pripravljen.
          {'\n'}Status rezervacije lahko spremljaš na strani "Moje rezervacije".
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MyReservations' as never)}
        >
          <Text style={styles.buttonText}>Preglej rezervacijo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3', marginTop: 8 }]}
          onPress={() => navigation.navigate('Domov' as never)}
        >
          <Text style={styles.buttonText}>🏠 Nazaj na domov</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (activeReservation) {
    const remainingDisplay = isActiveExpired
      ? '⏰ Izposoja je potekla!'
      : `⏳ Preostal čas: ${calculateRemainingDays(activeReservation.endDate)}`;

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.activeCard, isActiveExpired && styles.expiredCard]}>
          <Text style={styles.activeTitle}>✅ Rezervacija je potrjena</Text>
          <Text style={styles.activeStatus}>
            Status: <Text style={[styles.statusHighlight, isActiveExpired && styles.expiredStatus]}>
              {isActiveExpired ? 'Potekla' : 'Aktivna'}
            </Text>
          </Text>

          <View style={styles.activeInfoContainer}>
            <Text style={styles.activeInfoText}>📅 Od: {activeReservation.startDate}</Text>
            <Text style={styles.activeInfoText}>📅 Do: {activeReservation.endDate}</Text>
          </View>

          {isActiveExpired ? (
            <View style={styles.expiredContainer}>
              <Icon name="alert-circle" size={24} color="#d32f2f" />
              <Text style={styles.expiredText}>⏰ Izposoja je potekla!</Text>
            </View>
          ) : (
            <Text style={styles.remainingTimeText}>{remainingDisplay}</Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MyReservations' as never)}
          >
            <Text style={styles.buttonText}>Preglej vse rezervacije</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#2196F3', marginTop: 8 }]}
            onPress={() => navigation.navigate('Domov' as never)}
          >
            <Text style={styles.buttonText}>🏠 Nazaj na domov</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Rezervacija predmeta</Text>

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.ownerName}>👤 Lastnik: {item.ownerName}</Text>
        <Text style={styles.rating}>⭐ {item.rating} ({item.reviewsCount} mnenj)</Text>
        <Text style={styles.period}>
          🕒 Največji čas izposoje: {item.rentalPeriod || '7 dni (privzeto)'}
        </Text>
      </View>

      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>📆 Izberi trajanje izposoje (v dnevih)</Text>
        <View style={styles.durationRow}>
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => setDurationDays(Math.max(1, durationDays - 1))}
            disabled={durationDays <= 1}
          >
            <Text style={styles.durationButtonText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.durationInput}
            value={String(durationDays)}
            onChangeText={(text) => {
              const num = parseInt(text) || 1;
              const clamped = Math.min(Math.max(num, 1), maxDays);
              setDurationDays(clamped);
            }}
            keyboardType="number-pad"
            maxLength={3}
          />
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => setDurationDays(Math.min(maxDays, durationDays + 1))}
            disabled={durationDays >= maxDays}
          >
            <Text style={styles.durationButtonText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.durationInfo}>
            / {formatDuration(maxDays)}
          </Text>
        </View>
        <Text style={styles.durationHint}>
          Izbrano: {formatDuration(durationDays)}
        </Text>
      </View>

      <Text style={styles.calendarTitle}>📅 Izberi datum začetka izposoje</Text>
      <Calendar
        markedDates={getMarkedDates()}
        markingType={'period'}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        minDate={new Date().toISOString().split('T')[0]}
        theme={{
          selectedDayBackgroundColor: '#4CAF50',
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
        }}
      />

      <TouchableOpacity
        style={[styles.button, isCreating && styles.buttonDisabled]}
        onPress={handleReserve}
        disabled={isCreating}
      >
        <Text style={styles.buttonText}>
          {isCreating ? 'Obdelava...' : 'Potrdi rezervacijo'}
        </Text>
      </TouchableOpacity>

      {isCreating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Ustvarjanje rezervacije...</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  itemInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  ownerName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    color: '#f5a623',
    marginTop: 2,
  },
  period: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  durationContainer: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  durationButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 18,
    width: 50,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  durationInfo: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  durationHint: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    marginTop: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#4CAF50',
  },
  confirmSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  activeCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginTop: 10,
  },
  expiredCard: {
    borderColor: '#d32f2f',
    backgroundColor: '#fff5f5',
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  activeStatus: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 12,
  },
  statusHighlight: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  expiredStatus: {
    color: '#d32f2f',
  },
  activeInfoContainer: {
    marginVertical: 8,
  },
  activeInfoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginVertical: 2,
  },
  remainingTimeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginVertical: 8,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  expiredText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
