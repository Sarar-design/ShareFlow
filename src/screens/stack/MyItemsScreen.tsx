import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useGetItemsQuery, useGetMyReservationsQuery } from '../../api/api';
import { db } from '../../config/firebase';
import { RootState } from '../../store';


type RootStackParamList = {
  ItemDetail: { id: string };
  EditItem: { itemId: string };
  Dodaj: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'active' | 'archived' | 'all';


export default function MyItemsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('active');

  
  const { data: allItems, isLoading, isError, refetch } = useGetItemsQuery();

  
  const { data: allReservations, refetch: refetchReservations } =
    useGetMyReservationsQuery(user?.id || '', {
      skip: !user?.id,
    });

  
  const myItems = allItems?.filter((item) => item.ownerId === user?.id) || [];
  const filteredItems = myItems.filter((item) => {
    if (filter === 'active') return item.status !== 'archived';
    if (filter === 'archived') return item.status === 'archived';
    return true;
  });

  
  const getItemReservations = (itemId: string) => {
    return allReservations?.filter((res) => res.itemId === itemId) || [];
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

  
  const handleDelete = (itemId: string, itemTitle: string) => {
    Alert.alert('Potrditev brisanja', `Ali res želiš izbrisati oglas "${itemTitle}"?`, [
      { text: 'Prekliči', style: 'cancel' },
      {
        text: 'Izbriši',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(itemId);
          try {
            await deleteDoc(doc(db, 'items', itemId));
            Alert.alert('Uspeh', 'Oglas je bil izbrisan.');
            refetch();
          } catch (error: any) {
            Alert.alert('Napaka', 'Brisanje ni uspelo: ' + error.message);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  
  const toggleArchive = async (item: any) => {
    const newStatus = item.status === 'archived' ? 'active' : 'archived';
    const actionText = newStatus === 'archived' ? 'arhiviran' : 'od-arhiviran';
    setArchivingId(item.id);
    try {
      await updateDoc(doc(db, 'items', item.id), {
        status: newStatus,
        archivedAt: newStatus === 'archived' ? new Date().toISOString() : null,
      });
      Alert.alert('Uspeh', `Oglas je bil ${actionText}.`);
      refetch();
    } catch (error: any) {
      Alert.alert('Napaka', `Napaka pri ${actionText}ju: ` + error.message);
    } finally {
      setArchivingId(null);
    }
  };

 
  const renderItem = ({ item }: { item: any }) => {
    const isArchived = item.status === 'archived';
    const reservations = getItemReservations(item.id);

    return (
      <View style={[styles.card, isArchived && styles.cardArchived]}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.rentalPeriod}>🕒 {item.rentalPeriod || 'Po dogovoru'}</Text>
            <Text style={styles.price}>💰 {item.price || 'Brezplačno'}</Text>
            {isArchived && (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedText}>Arhivirano</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditItem', { itemId: item.id })}
          >
            <Icon name="create-outline" size={22} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleArchive(item)}
            disabled={archivingId === item.id}
          >
            {archivingId === item.id ? (
              <ActivityIndicator size="small" color="#FF9800" />
            ) : (
              <Icon name={isArchived ? 'archive-outline' : 'archive'} size={22} color="#FF9800" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id, item.title)}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#d32f2f" />
            ) : (
              <Icon name="trash-outline" size={22} color="#d32f2f" />
            )}
          </TouchableOpacity>
        </View>

        
        {reservations.length > 0 && (
          <View style={styles.reservationsSection}>
            <Text style={styles.reservationsTitle}>📋 Rezervacije ({reservations.length})</Text>
            {reservations.map((res) => (
              <View key={res.id} style={styles.reservationItem}>
                <Text style={styles.reservationStatus}>
                  Status: {res.status === 'potrjena' ? 'Potrjena' :
                           res.status === 'aktivna' ? 'Aktivna' :
                           res.status === 'končana' ? 'Končana' : res.status}
                </Text>
                <Text style={styles.reservationDate}>
                  {res.startDate} → {res.endDate}
                </Text>
                <View style={styles.reservationActions}>
                  {res.status === 'potrjena' && (
                    <TouchableOpacity
                      style={[styles.smallButton, styles.smallButtonConfirm]}
                      onPress={() => handleConfirmPickup(res.id)}
                    >
                      <Text style={styles.smallButtonText}>✅ Potrdi prevzem</Text>
                    </TouchableOpacity>
                  )}
                  {res.status === 'aktivna' && (
                    <TouchableOpacity
                      style={[styles.smallButton, styles.smallButtonComplete]}
                      onPress={() => handleCompleteReservation(res.id)}
                    >
                      <Text style={styles.smallButtonText}>🏁 Zaključi</Text>
                    </TouchableOpacity>
                  )}
                  {res.status === 'končana' && (
                    <View style={styles.completedBadgeSmall}>
                      <Text style={styles.completedBadgeText}>✅ Končano</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje tvojih oglasov...</Text>
      </View>
    );
  }

  
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Napaka pri nalaganju oglasov.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Poskusi znova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  if (myItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="document-text-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>Nimaš še nobenih oglasov</Text>
        <Text style={styles.emptySubtitle}>Dodaj svoj prvi oglas in začni izmenjavo!</Text>
        <TouchableOpacity style={styles.emptyAddButton} onPress={() => navigation.navigate('Dodaj')}>
          <Text style={styles.emptyAddButtonText}>➕ Dodaj oglas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Moji oglasi</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Dodaj')}>
          <Icon name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>Aktivni</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'archived' && styles.filterActive]}
          onPress={() => setFilter('archived')}
        >
          <Text style={[styles.filterText, filter === 'archived' && styles.filterTextActive]}>Arhivirani</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Vsi</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'active'
                ? 'Ni aktivnih oglasov.'
                : filter === 'archived'
                ? 'Ni arhiviranih oglasov.'
                : 'Ni oglasov.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  listContent: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: '#d32f2f', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 20, textAlign: 'center' },
  emptyAddButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyAddButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  filterContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, marginHorizontal: 4 },
  filterActive: { backgroundColor: '#4CAF50' },
  filterText: { color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardArchived: { opacity: 0.7, borderColor: '#ddd' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  rentalPeriod: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  price: { fontSize: 12, color: '#333', marginTop: 2 },
  archivedBadge: { backgroundColor: '#f0f0f0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  archivedText: { fontSize: 10, color: '#888' },
  actions: { flexDirection: 'row', marginLeft: 8 },
  actionButton: { padding: 8, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  
  reservationsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reservationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  reservationItem: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  reservationStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  reservationDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  reservationActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  smallButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 6,
  },
  smallButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  smallButtonComplete: {
    backgroundColor: '#FF9800',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  completedBadgeSmall: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: '600',
  },
});