import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLike } from '../hooks/useLike';
import { Item } from '../types';

interface Props {
  item: Item;
  onPress: () => void;
  showLikeButton?: boolean;
}

export default function ItemCard({ item, onPress, showLikeButton = true }: Props) {
  const { isLiked, likesCount, toggleLike } = useLike(item.id);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.7}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.distance}>{item.distance} km oddaljeno</Text>
        <Text style={styles.owner}>{item.ownerName}</Text>
        
        <View style={styles.row}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <Text style={styles.reviews}>({item.reviewsCount} mnenj)</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.period}>🕒 {item.rentalPeriod}</Text>
          <Text style={styles.type}>{item.type}</Text>
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
      </View>

      {showLikeButton && (
        <TouchableOpacity
          style={styles.likeButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleLike();
          }}
        >
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#d32f2f' : '#888'}
          />
          {likesCount > 0 && (
            <Text style={styles.likeCount}>{likesCount}</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  typeBadge: {
  backgroundColor: '#e8f5e9',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  alignSelf: 'flex-start',
  marginTop: 4,
},
typeBadgeText: {
  fontSize: 10,
  color: '#2e7d32',
  fontWeight: '600',
},
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  distance: {
    fontSize: 12,
    color: '#666',
  },
  owner: {
    fontSize: 12,
    color: '#888',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5a623',
  },
  reviews: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  period: {
    fontSize: 12,
    color: '#4CAF50',
    marginRight: 8,
  },
  type: {
    fontSize: 12,
    color: '#2196F3',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 4,
  },
  likeCount: {
    fontSize: 10,
    color: '#888',
    marginTop: 0,
  },
});