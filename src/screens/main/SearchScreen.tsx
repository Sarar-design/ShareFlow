import Icon from '@expo/vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGetItemsQuery } from '../../api/api';
import ItemCard from '../../components/ItemCard';


const CATEGORIES = [
  'Vse',
  'Kuhinja',
  'Šport',
  'Vrt',
  'Tehnologija',
  'Oblačila',
  'Orodje',
  'Knjige',
  'Igrače',
  'Glasbila',
  'Drugo',
];


const TYPES = [
  { key: 'Vse', label: 'Vse' },
  { key: 'izposoja', label: '📦 Izposoja' },
  { key: 'izmenjava', label: '🔄 Izmenjava' },
  { key: 'prodaja', label: '💰 Prodaja' },
  { key: 'oddaja', label: '🏠 Oddaja' },
  { key: 'prošnja', label: '🙏 Prošnja' },
];


const POPULAR_TAGS = ['poceni', 'novo', 'odlično_stanje', 'original', 'garancija', 'hitro'];

export default function SearchScreen({ navigation }: any) {
  const route = useRoute();
  const initialQuery = (route.params as any)?.searchQuery || '';

  
  const [selectedCategory, setSelectedCategory] = useState('Vse');
  const [selectedType, setSelectedType] = useState('Vse');
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  
  const { data: allItems, isLoading, isError, refetch } = useGetItemsQuery();

  
  const filteredItems = useMemo(() => {
    if (!allItems) return [];

    
    let items = allItems.filter((item) => item.status !== 'archived');

    
    if (selectedCategory !== 'Vse') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (selectedType !== 'Vse') {
      items = items.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const hashQuery = query.startsWith('#') ? query.substring(1) : '';
      const isHashSearch = query.startsWith('#');

      items = items.filter((item) => {
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDescription = item.description.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchOwner = item.ownerName.toLowerCase().includes(query);
        const matchTags = item.tags?.some((tag) => tag.toLowerCase().includes(query)) || false;
        const matchHashTag = isHashSearch && item.tags?.some((tag) => tag.toLowerCase().includes(hashQuery)) || false;

        return matchTitle || matchDescription || matchCategory || matchOwner || matchTags || matchHashTag;
      });
    }

    return items;
  }, [allItems, selectedCategory, selectedType, searchQuery]);

  const clearSearch = () => setSearchQuery('');
  const handleTagPress = (tag: string) => setSearchQuery(`#${tag}`);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje oglasov...</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Išči predmete, ljudi, kategorije..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.length === 0 && (
        <View style={styles.popularTagsContainer}>
          <Text style={styles.popularTagsTitle}>🔥 Priljubljene oznake</Text>
          <View style={styles.popularTagsList}>
            {POPULAR_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.popularTagChip}
                onPress={() => handleTagPress(tag)}
              >
                <Text style={styles.popularTagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>🏷️ Vrste oglasov</Text>
        <FlatList
          horizontal
          data={TYPES}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(item.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipList}
        />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>📂 Kategorije</Text>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipList}
        />
      </View>

      <Text style={styles.resultsCount}>
        {filteredItems.length} {filteredItems.length === 1 ? 'oglas' : 'oglasov'}
      </Text>

      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Ni zadetkov</Text>
            <Text style={styles.emptySubtitle}>
              Poskusi z drugim iskalnim nizom ali kategorijo.
            </Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                <Text style={styles.clearSearchButtonText}>Počisti iskanje</Text>
              </TouchableOpacity>
            )}
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 4,
  },
  popularTagsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  popularTagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  popularTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularTagChip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  popularTagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  filterSection: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  filterChipList: {
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
      
       
  