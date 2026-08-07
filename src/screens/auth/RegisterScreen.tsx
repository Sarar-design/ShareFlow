import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebase';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Napaka', 'Vsi podatki so obvezni.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Napaka', 'Geslo mora imeti vsaj 6 znakov.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: name.trim(),
        email: firebaseUser.email || '',
        rating: 0,
        reviewsCount: 0,
        level: 1,
        xp: 0,
        maxXp: 250,
        badges: [],
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Uspeh', 'Račun ustvarjen! Zdaj se prijavi.', [
        { text: 'V redu', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Napaka pri registraciji', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registracija</Text>
      <Text style={styles.subtitle}>Ustvari račun za dostop do vseh funkcij.</Text>

      <TextInput
        style={styles.input}
        placeholder="Ime"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Geslo (min. 6 znakov)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Ustvarjanje...' : 'Registriraj se'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Že imaš račun? Prijavi se</Text>
      </TouchableOpacity>
    </View>
  );
}

// SLOGI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    marginTop: 15,
    color: '#2196F3',
    fontSize: 14,
  },
});
