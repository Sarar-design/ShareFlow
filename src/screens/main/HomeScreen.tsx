import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  useGetEventsQuery,
  useGetItemsQuery,
  useGetMyReservationsQuery,
} from '../../api/api';
import EventCard from '../../components/EventCard';
import ItemCard from '../../components/ItemCard';
import { RootState } from '../../store';

const POPULAR_TAGS = ['poceni', 'novo', 'odlično_stanje', 'original', 'garancija', 'hitro'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    data: items,
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useGetItemsQuery();

  const {
    data: events,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useGetEventsQuery();

  const {
    data: myReservations,
    isLoading: reservationsLoading,
    isError: reservationsError,
    refetch: refetchReservations,
  } = useGetMyReservationsQuery(user?.id || '', {
    skip: !user?.id,
  });

  const isLoading = itemsLoading || eventsLoading || reservationsLoading;
  const isError = itemsError || eventsError || reservationsError;

  const refetchAll = () => {
    refetchItems();
    refetchEvents();
    refetchReservations();
  };

  const borrowedItemIds = myReservations?.map((res) => res.itemId) || [];
  const borrowedItems = items?.filter((item) =>
    borrowedItemIds.includes(item.id)
  );

  const nearbyItems = useMemo(() => {
    if (!items) return [];
    return items
      .filter((item) => item.status !== 'archived') // ✅ SKRIJ ARHIVIRANE
      .slice(0, 3);
  }, [items]);

  const handleTagPress = (tag: string) => {
    navigation.navigate('Išči', { searchQuery: `#${tag}` });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje vsebine...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Prišlo je do napake pri nalaganju.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchAll}>
          <Text style={styles.retryButtonText}>Poskusi znova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetchAll} />
      }
    >
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Pozdravljen, {user?.name || 'Gost'} 👋</Text>
      </View>

      
      <View style={styles.tagsSection}>
        <Text style={styles.sectionTitle}>🔥 Priljubljene oznake</Text>
        <View style={styles.tagsContainer}>
          {POPULAR_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tagChip}
              onPress={() => handleTagPress(tag)}
            >
              <Text style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      
      <Text style={styles.sectionTitle}>📦 Predmeti, ki jih imaš v izposoji</Text>
      {borrowedItems && borrowedItems.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {borrowedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPress={() =>
                navigation.navigate('ItemDetail', { id: item.id })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={() => navigation.navigate('Išči')}
        >
          <Icon name="search-outline" size={24} color="#888" />
          <Text style={styles.emptyText}>
            Ni izposojenih predmetov. Raziskuj oglase
          </Text>
        </TouchableOpacity>
      )}

      
      <Text style={styles.sectionTitle}>
        🤝 Tvoje prihajajoče izmenjave spretnosti
      </Text>
      <TouchableOpacity
        style={styles.emptyCard}
        onPress={() => navigation.navigate('Išči')}
      >
        <Icon name="people-outline" size={24} color="#888" />
        <Text style={styles.emptyText}>
          Ni rezerviranih izmenjav spretnosti. Raziskuj oglase
        </Text>
      </TouchableOpacity>

    
      <Text style={styles.sectionTitle}>📅 Tvoji prihajajoči dogodki</Text>
      {events && events.length > 0 ? (
        events.slice(0, 2).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() =>
              navigation.navigate('EventDetail', { id: event.id })
            }
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Ni prihajajočih dogodkov.</Text>
        </View>
      )}

      
      <Text style={styles.sectionTitle}>📍 Oglasi blizu tebe</Text>
      {nearbyItems.length > 0 ? (
        nearbyItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onPress={() =>
              navigation.navigate('ItemDetail', { id: item.id })
            }
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Trenutno ni aktivnih oglasov v bližini.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
  tagsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
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
    marginTop: 4,
  },
});