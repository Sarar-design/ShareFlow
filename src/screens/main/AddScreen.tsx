import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { db, storage } from '../../config/firebase';
import { RootState } from '../../store';
import { updateUser } from '../../store/authSlice';


const CATEGORIES = [
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


const POPULAR_TAGS = ['poceni', 'odlično_stanje', 'novo', 'rabijeno', 'hitro', 'v_dobrem_stanju', 'garancija', 'original'];


const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 10) + 1;
};

export default function AddScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tags, setTags] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  
  const [type, setType] = useState<'izposoja' | 'prošnja' | 'izmenjava' | 'prodaja' | 'oddaja'>('izposoja');
  const [showRentalPeriod, setShowRentalPeriod] = useState(true);

  
  const handleTypeChange = (selectedType: string) => {
    setType(selectedType as any);
    
    if (selectedType === 'prodaja') {
      setShowRentalPeriod(false);
      setRentalPeriod(''); 
    } else {
      setShowRentalPeriod(true);
    }
  };

  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Dovoljenje zavrnjeno',
        'Za dodajanje slik potrebujemo dostop do tvoje galerije.'
      );
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
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileName = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `items/${fileName}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      throw new Error(`Napaka pri nalaganju slike: ${error.message}`);
    }
  };

  
  const addTag = (tag: string) => {
    const currentTags = tags.split(',').map((t) => t.trim()).filter((t) => t);
    if (!currentTags.includes(tag)) {
      setTags([...currentTags, tag].join(', '));
    }
    setTagSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = tags.split(',').map((t) => t.trim()).filter((t) => t && t !== tagToRemove);
    setTags(currentTags.join(', '));
  };

  
  const handleSubmit = async () => {
    
    if (!title.trim()) {
      Alert.alert('Napaka', 'Vnesi naslov oglasa.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Napaka', 'Vnesi opis oglasa.');
      return;
    }
    if (!category) {
      Alert.alert('Napaka', 'Izberi kategorijo.');
      return;
    }
    if (!image) {
      Alert.alert('Napaka', 'Dodaj sliko oglasa.');
      return;
    }
    if (!user) {
      Alert.alert('Napaka', 'Nisi prijavljen. Za objavo se prijavi.');
      return;
    }

    setLoading(true);

    try {
      
      const imageUrl = await uploadImage(image);

      
      const newItem = {
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl,
        ownerId: user.id,
        ownerName: user.name || 'Uporabnik',
        rentalPeriod: rentalPeriod.trim() || 'Po dogovoru',
        price: price.trim() || 'Brezplačno',
        type: type,
        rating: 0,
        reviewsCount: 0,
        distance: 0,
        availableDates: {},
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        likesCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'items'), newItem);

      
      const newXP = (user.xp || 0) + 10;
      const newLevel = getLevelFromXP(newXP);

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
      });

      
      dispatch(updateUser({ xp: newXP, level: newLevel }));

      Alert.alert('Uspeh', 'Tvoj oglas je bil uspešno objavljen! +10 XP 🎉', [
        { text: 'V redu', onPress: () => navigation.navigate('Domov' as never) },
      ]);

      
      setTitle('');
      setDescription('');
      setCategory('');
      setRentalPeriod('');
      setPrice('');
      setImage(null);
      setTags('');
      setType('izposoja');
      setShowRentalPeriod(true);
    } catch (error: any) {
      Alert.alert('Napaka pri objavi', error.message || 'Nekaj je šlo narobe. Poskusi znova.');
    } finally {
      setLoading(false);
    }
  };

  
  const removeImage = () => {
    setImage(null);
  };

  
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Dodaj nov oglas</Text>

      
      <Text style={styles.label}>Naslov *</Text>
      <TextInput
        style={styles.input}
        placeholder="Npr. Električna kolesa"
        value={title}
        onChangeText={setTitle}
        maxLength={60}
      />

      
      <Text style={styles.label}>Opis *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Opiši predmet, stanje, pogoje izposoje..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      
      <Text style={styles.label}>Vrsta oglasa *</Text>
      <View style={styles.typeContainer}>
        {[
          { key: 'izposoja', label: '📦 Izposoja' },
          { key: 'izmenjava', label: '🔄 Izmenjava' },
          { key: 'prodaja', label: '💰 Prodaja' },
          { key: 'oddaja', label: '🏠 Oddaja' },
          { key: 'prošnja', label: '🙏 Prošnja' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeButton, type === t.key && styles.typeButtonActive]}
            onPress={() => handleTypeChange(t.key)}
          >
            <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      
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
              style={[
                styles.categoryOption,
                category === cat && styles.categoryOptionSelected,
              ]}
              onPress={() => {
                setCategory(cat);
                setShowCategoryPicker(false);
              }}
            >
              <Text
                style={[
                  styles.categoryOptionText,
                  category === cat && styles.categoryOptionTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      
      {showRentalPeriod && (
        <>
          <Text style={styles.label}>Čas izposoje</Text>
          <TextInput
            style={styles.input}
            placeholder="Npr. 2 tedna, 3 dni, 5 ur..."
            value={rentalPeriod}
            onChangeText={setRentalPeriod}
          />
        </>
      )}

      
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
              const suggestions = POPULAR_TAGS.filter(
                (tag) =>
                  tag.toLowerCase().includes(lastWord) &&
                  !text.split(',').map((t) => t.trim()).includes(tag)
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
        {tags.split(',').map((t) => t.trim()).filter((t) => t).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>#{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)}>
              <Icon name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      
      <Text style={styles.label}>Slike *</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Icon name="close-circle" size={28} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="camera-outline" size={40} color="#4CAF50" />
            <Text style={styles.imagePlaceholderText}>Dodaj sliko</Text>
            <Text style={styles.imagePlaceholderSubtext}>Tapni za izbiro</Text>
          </View>
        )}
      </TouchableOpacity>

    
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitText}> Objavljanje...</Text>
          </View>
        ) : (
          <Text style={styles.submitText}>Objavi oglas (+10 XP)</Text>
        )}
      </TouchableOpacity>

      
      <Text style={styles.requiredNote}>* Obvezna polja</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: '#fafafa',
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeText: {
    fontSize: 14,
    color: '#333',
  },
  typeTextActive: {
    color: '#fff',
  },
  tagsContainer: {
    marginBottom: 4,
  },
  tagsInput: {
    marginBottom: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 4,
  },
  suggestionChip: {
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  suggestionText: {
    color: '#0284c7',
    fontSize: 14,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
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
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});