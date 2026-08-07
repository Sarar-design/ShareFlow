import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSelector } from 'react-redux';
import {
  useGetItemByIdQuery,
  useGetItemsQuery,
  useGetUserByIdQuery,
  useGetReservationsByItemQuery, 
} from '../../api/api';
import { db } from '../../config/firebase';
import { useLike } from '../../hooks/useLike';
import { findOrCreateChat } from '../../services/chatService';
import { RootState } from '../../store';
import { Reservation } from '../../types';

const ReservationItem = ({
  reservation,
  onConfirmPickup,
  onComplete,
  updating,
}: {
  reservation: Reservation;
  onConfirmPickup: (id: string) => void;
  onComplete: (id: string) => void;
  updating: boolean;
}) => {
  const { data: renter } = useGetUserByIdQuery(reservation.userId, {
    skip: !reservation.userId,
  });

  const statusLabel =
    reservation.status === 'potrjena' ? 'Potrjena' :
    reservation.status === 'aktivna' ? 'Aktivna' :
    reservation.status === 'končana' ? 'Končana' : reservation.status;

  return (
    <View style={styles.reservationItem}>
      <Text style={styles.renterName}>👤 {renter?.name || 'Neznan uporabnik'}</Text>
      <Text style={styles.reservationStatus}>Status: {statusLabel}</Text>
      <Text style={styles.reservationDate}>
        {reservation.startDate} → {reservation.endDate}
      </Text>

      {reservation.status === 'potrjena' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onConfirmPickup(reservation.id)}
          disabled={updating}
        >
          <Icon name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>✅ Potrdi prevzem</Text>
        </TouchableOpacity>
      )}

      {reservation.status === 'aktivna' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonComplete]}
          onPress={() => onComplete(reservation.id)}
          disabled={updating}
        >
          <Icon name="flag-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>🏁 Zaključi</Text>
        </TouchableOpacity>
      )}

      {reservation.status === 'končana' && (
        <Text style={styles.completedText}>✅ Zaključeno</Text>
      )}
    </View>
  );
};

export default function ItemDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { id } = route.params as { id: string };

  const [contactLoading, setContactLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { data: item, isLoading, isError, refetch } = useGetItemByIdQuery(id);
  const { data: allItems } = useGetItemsQuery();
  const { isLiked, likesCount, toggleLike } = useLike(id);

  
  const {
    data: itemReservations,
    refetch: refetchReservations,
  } = useGetReservationsByItemQuery(id, {
    skip: !id,
  });

  const allReservations = itemReservations || [];
  const isOwner = user?.id === item?.ownerId;

  const similarItems = item ? (allItems?.filter(
    (i) => i.category === item.category && i.id !== item.id
  ).slice(0, 3) || []) : [];

  const handleContactOwner = async () => {
    if (!user?.id) {
      Alert.alert('Napaka', 'Za kontaktiranje se moraš prijaviti.');
      return;
    }
    if (!item?.ownerId) {
      Alert.alert('Napaka', 'Lastnik ni znan.');
      return;
    }
    setContactLoading(true);
    try {
      const chatId = await findOrCreateChat(
        user.id,
        item.ownerId,
        item.id
      );
      navigation.navigate('ChatDetail', {
        chatId: chatId,
        receiverId: item.ownerId,
        userName: item.ownerName || 'Lastnik',
        itemId: item.id,
      });
    } catch (error: any) {
      Alert.alert('Napaka', 'Klepet ni bilo mogoče ustvariti: ' + error.message);
    } finally {
      setContactLoading(false);
    }
  };

  const handleOwnerPress = () => {
    if (item?.ownerId) {
      navigation.navigate('UserProfile', { id: item.ownerId });
    }
  };

  const handleConfirmPickup = async (reservationId: string) => {
    if (updating) return;
    Alert.alert(
      'Potrditev prevzema',
      'Ali si prepričan/a, da je uporabnik prevzel predmet?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Potrdi',
          onPress: async () => {
            setUpdating(true);
            try {
              const reservationRef = doc(db, 'reservations', reservationId);
              await updateDoc(reservationRef, {
                status: 'aktivna',
                confirmedAt: new Date().toISOString(),
              });
              Alert.alert('Uspeh', 'Prevzem je potrjen!');
              await refetchReservations();
              await refetch();
            } catch (error: any) {
              Alert.alert('Napaka', 'Potrditev ni uspela: ' + error.message);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteReservation = async (reservationId: string) => {
    if (updating) return;
    Alert.alert(
      'Potrditev zaključka',
      'Ali si prepričan/a, da je izmenjava zaključena?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Zaključi',
          onPress: async () => {
            setUpdating(true);
            try {
              const reservationRef = doc(db, 'reservations', reservationId);
              await updateDoc(reservationRef, {
                status: 'končana',
                completedAt: new Date().toISOString(),
              });
              Alert.alert('Uspeh', 'Izmenjava je zaključena!');
              await refetchReservations();
              await refetch();
            } catch (error: any) {
              Alert.alert('Napaka', 'Zaključek ni uspel: ' + error.message);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje podrobnosti...</Text>
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color="#d32f2f" />
        <Text style={styles.errorText}>Oglas ni najden.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Poskusi znova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (item.status === 'archived' && user?.id !== item.ownerId) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="archive-outline" size={60} color="#888" />
        <Text style={styles.errorText}>Ta oglas je arhiviran.</Text>
        <Text style={styles.subText}>Oglas ni več na voljo za ogled.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Nazaj</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'izposoja' ? '📦 Izposoja' :
             item.type === 'izmenjava' ? '🔄 Izmenjava' :
             item.type === 'prodaja' ? '💰 Prodaja' :
             item.type === 'oddaja' ? '🏠 Oddaja' :
             '🙏 Prošnja'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.distance} km oddaljeno</Text>
          </View>
          {item.type !== 'prodaja' && (
            <View style={styles.infoItem}>
              <Icon name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Čas izposoje: {item.rentalPeriod || 'Po dogovoru'}
              </Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Icon name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.price || 'Brezplačno'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ownerContainer} onPress={handleOwnerPress}>
          <View style={styles.ownerInfo}>
            <Icon name="person-circle-outline" size={40} color="#4CAF50" />
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{item.ownerName}</Text>
              <View style={styles.ownerRating}>
                <Icon name="star" size={14} color="#FFC107" />
                <Text style={styles.ownerRatingText}>
                  {item.rating} ({item.reviewsCount} mnenj)
                </Text>
              </View>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {isOwner && (
          <View style={styles.ownerActions}>
            <Text style={styles.ownerActionsTitle}>📋 Upravljanje rezervacij</Text>
            {allReservations.length === 0 ? (
              <Text style={styles.noReservationText}>Ni rezervacij za ta oglas.</Text>
            ) : (
              allReservations.map((res: Reservation) => (
                <ReservationItem
                  key={res.id}
                  reservation={res}
                  onConfirmPickup={handleConfirmPickup}
                  onComplete={handleCompleteReservation}
                  updating={updating}
                />
              ))
            )}
          </View>
        )}

        
        <View style={styles.likeSection}>
          <TouchableOpacity style={styles.likeButton} onPress={toggleLike}>
            <Icon name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? '#d32f2f' : '#888'} />
            <Text style={[styles.likeButtonText, isLiked && styles.likeButtonTextActive]}>
              {isLiked ? 'Odstrani všeček' : 'Všečkaj'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.likesCount}>
            {likesCount} {likesCount === 1 ? 'všeček' : 'všečkov'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>📝 Opis</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>🏷️ Oznake</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => navigation.navigate('Išči', { searchQuery: `#${tag}` })}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {item.type !== 'prodaja' && (
          <>
            <Text style={styles.sectionTitle}>📅 Razpoložljivost</Text>
            <Calendar
              markedDates={item.availableDates || {}}
              theme={{
                selectedDayBackgroundColor: '#4CAF50',
                todayTextColor: '#4CAF50',
                arrowColor: '#4CAF50',
              }}
            />
          </>
        )}

        {item.type !== 'prodaja' && item.status !== 'archived' && (
          <TouchableOpacity
            style={styles.reserveButton}
            onPress={() => navigation.navigate('Reservation', { itemId: item.id })}
          >
            <Icon name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.reserveButtonText}>Rezerviraj</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactOwner}
          disabled={contactLoading}
        >
          {contactLoading ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <>
              <Icon name="chatbubble-outline" size={20} color="#2196F3" />
              <Text style={styles.contactButtonText}>Kontaktiraj lastnika</Text>
            </>
          )}
        </TouchableOpacity>

        {similarItems.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>🔍 Podobni oglasi</Text>
            {similarItems.map((similarItem) => (
              <TouchableOpacity
                key={similarItem.id}
                style={styles.similarItem}
                onPress={() => navigation.replace('ItemDetail', { id: similarItem.id })}
              >
                <Image source={{ uri: similarItem.imageUrl }} style={styles.similarImage} />
                <View style={styles.similarInfo}>
                  <Text style={styles.similarTitle} numberOfLines={1}>
                    {similarItem.title}
                  </Text>
                  <Text style={styles.similarOwner}>{similarItem.ownerName}</Text>
                  <Text style={styles.similarPrice}>{similarItem.price || 'Brezplačno'}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  errorText: { fontSize: 18, color: '#d32f2f', textAlign: 'center', marginTop: 12 },
  subText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  retryButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', flex: 1, marginRight: 8 },
  categoryBadge: { backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryBadgeText: { fontSize: 12, color: '#1976D2', fontWeight: '500' },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  typeBadgeText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  infoText: { fontSize: 12, color: '#666', marginLeft: 4 },
  ownerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, marginBottom: 16 },
  ownerInfo: { flexDirection: 'row', alignItems: 'center' },
  ownerDetails: { marginLeft: 12 },
  ownerName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  ownerRating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ownerRatingText: { fontSize: 12, color: '#666', marginLeft: 4 },
  ownerActions: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  ownerActionsTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  statusText: { fontSize: 14, color: '#555', marginBottom: 6 },
  renterInfo: { fontSize: 14, color: '#2196F3', marginBottom: 6, fontWeight: '500' },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  actionButtonComplete: { backgroundColor: '#FF9800' },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  noReservationText: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  likeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  likeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f8f9fa' },
  likeButtonText: { fontSize: 14, color: '#888', marginLeft: 8 },
  likeButtonTextActive: { color: '#d32f2f' },
  likesCount: { fontSize: 14, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginTop: 16, marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, color: '#333' },
  tagsSection: { marginTop: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagChip: { backgroundColor: '#e3f2fd', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 6 },
  tagText: { fontSize: 12, color: '#1976D2', fontWeight: '500' },
  reserveButton: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  reserveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  contactButton: { flexDirection: 'row', backgroundColor: '#e3f2fd', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderWidth: 1, borderColor: '#2196F3', minHeight: 54 },
  contactButtonText: { color: '#2196F3', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  similarSection: { marginTop: 20, marginBottom: 40 },
  similarItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 10, marginBottom: 8 },
  similarImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  similarInfo: { flex: 1 },
  similarTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  similarOwner: { fontSize: 12, color: '#888' },
  similarPrice: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  reservationItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  renterName: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  reservationStatus: { fontSize: 13, color: '#555', marginVertical: 2 },
  reservationDate: { fontSize: 12, color: '#888', marginBottom: 4 },
  completedText: { fontSize: 13, color: '#4CAF50', fontWeight: '600', marginTop: 4 },
});