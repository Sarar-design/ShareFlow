import Icon from '@expo/vector-icons/Ionicons';
import {
  collection,
  getDocs
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useGetItemsQuery } from '../../api/api';
import ItemCard from '../../components/ItemCard';
import { db } from '../../config/firebase';
import { RootState } from '../../store';

export default function LikesScreen({ navigation }: any) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [likeIds, setLikeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: allItems, isLoading: itemsLoading } = useGetItemsQuery();

  
  useEffect(() => {
    const fetchLikes = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        
        const likesRef = collection(db, 'users', user.id, 'likes');
        const likesSnap = await getDocs(likesRef);
        
        if (likesSnap.empty) {
          console.log('Ni všečkanih oglasov.');
          setLikeIds([]);
        } else {
          const ids = likesSnap.docs.map((doc) => doc.id);
          console.log('Najdeni všečkani ID-ji:', ids);
          setLikeIds(ids);
        }
      } catch (error) {
        console.error('Napaka pri nalaganju všečkov:', error);
        setLikeIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [user?.id]);

  
  const likedItems = allItems?.filter((item) =>
    likeIds.includes(item.id)
  ) || [];

  console.log('Vsi oglasi:', allItems?.length);
  console.log('Všečkani ID-ji:', likeIds);
  console.log('Filtrirani oglasi:', likedItems.length);

 
  if (loading || itemsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje všečkov...</Text>
      </View>
    );
  }

  
  if (likedItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="heart-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>Ni všečkanih oglasov</Text>
        <Text style={styles.emptySubtitle}>
          Všečkaj oglase, ki te zanimajo, in pojavili se bodo tukaj.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Išči')}
        >
          <Text style={styles.browseButtonText}>Razišči oglase</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>❤️ Všečki</Text>
      <FlatList
        data={likedItems}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
            showLikeButton={true}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  listContent: {
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
});