import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db, storage } from '../../config/firebase';

const CATEGORIES = [
  'Kuhinja', 'Šport', 'Vrt', 'Tehnologija', 'Oblačila',
  'Orodje', 'Knjige', 'Igrače', 'Glasbila', 'Drugo',
];



const POPULAR_TAGS = ['poceni', 'novo', 'odlično_stanje', 'original', 'garancija', 'hitro'];

export default function EditItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { itemId } = route.params as { itemId: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  
  const [tags, setTags] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docRef = doc(db, 'items', itemId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setDescription(data.description || '');
          setCategory(data.category || '');
          setRentalPeriod(data.rentalPeriod || '');
          setPrice(data.price || '');
          setExistingImageUrl(data.imageUrl || '');
          setTags(data.tags?.join(', ') || '');
        } else {
          Alert.alert('Napaka', 'Oglas ni najden.');
          navigation.goBack();
        }
      } catch (error: any) {
        Alert.alert('Napaka', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  
  const addTag = (tag: string) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      setTags([...currentTags, tag].join(', '));
    }
    setTagSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t && t !== tagToRemove);
    setTags(currentTags.join(', '));
  };

  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dovoljenje zavrnjeno', 'Potrebujemo dostop do galerije.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `items/${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !category) {
      Alert.alert('Napaka', 'Naslov, opis in kategorija so obvezni.');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = existingImageUrl;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

      await updateDoc(doc(db, 'items', itemId), {
        title: title.trim(),
        description: description.trim(),
        category,
        rentalPeriod: rentalPeriod.trim() || 'Po dogovoru',
        price: price.trim() || 'Brezplačno',
        imageUrl,
        tags: tagsArray, 
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Uspeh', 'Oglas je bil posodobljen.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Napaka', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Nalaganje...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Uredi oglas</Text>

      
      <Text style={styles.label}>Naslov *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        maxLength={60}
        placeholder="Vnesi naslov"
      />

      
      <Text style={styles.label}>Opis *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholder="Vnesi opis"
      />

      
      <Text style={styles.label}>Kategorija *</Text>
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
      >
        <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
          {category || 'Izberi kategorijo'}
        </Text>
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {showCategoryPicker && (
        <View style={styles.categoryList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryOption, category === cat && styles.categoryOptionSelected]}
              onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
            >
              <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      
      <Text style={styles.label}>Čas izposoje</Text>
      <TextInput
        style={styles.input}
        placeholder="Npr. 2 tedna"
        value={rentalPeriod}
        onChangeText={setRentalPeriod}
      />

      
      <Text style={styles.label}>Cena / Izposoja</Text>
      <TextInput
        style={styles.input}
        placeholder="Npr. 5€/dan ali Brezplačno"
        value={price}
        onChangeText={setPrice}
      />

      
      <Text style={styles.label}>Oznake (tagi)</Text>
      <Text style={styles.labelHint}>
        Vnesi tage ločene z vejico (npr. poceni, novo, odlično_stanje)
      </Text>
      <View style={styles.tagsContainer}>
        <TextInput
          style={[styles.input, styles.tagsInput]}
          placeholder="Npr. poceni, novo, rabijeno..."
          value={tags}
          onChangeText={(text) => {
            setTags(text);
            const lastWord = text.split(',').pop()?.trim().toLowerCase() || '';
            if (lastWord.length > 1) {
              const suggestions = POPULAR_TAGS.filter(tag =>
                tag.toLowerCase().includes(lastWord) &&
                !text.split(',').map(t => t.trim()).includes(tag)
              );
              setTagSuggestions(suggestions.slice(0, 5));
            } else {
              setTagSuggestions([]);
            }
          }}
        />
        {tagSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {tagSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => addTag(suggestion)}
              >
                <Text style={styles.suggestionText}>#{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tagsDisplay}>
        {tags.split(',').map(t => t.trim()).filter(t => t).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>#{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)}>
              <Icon name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      
      <Text style={styles.label}>Slike</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
              <Icon name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        ) : existingImageUrl ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: existingImageUrl }} style={styles.imagePreview} />
            <Text style={styles.imageHint}>Tapni za zamenjavo</Text>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="camera-outline" size={40} color="#4CAF50" />
            <Text style={styles.imagePlaceholderText}>Dodaj sliko</Text>
          </View>
        )}
      </TouchableOpacity>

      
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Shranjevanje...' : 'Shrani spremembe'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    color: '#333',
  },
  labelHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  categoryText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  categoryList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#e8f5e9',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  categoryOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tagsContainer: {
    position: 'relative',
  },
  tagsInput: {
    paddingRight: 40,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 10,
    padding: 4,
    elevation: 3,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2196F3',
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2',
    marginRight: 4,
    fontWeight: '500',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 8,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageHint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});