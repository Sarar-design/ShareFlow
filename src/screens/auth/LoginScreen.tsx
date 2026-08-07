import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch } from 'react-redux';
import { auth, db } from '../../config/firebase';
import { loginSuccess } from '../../store/authSlice';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Napaka', 'Vnesi email in geslo.');
      return;
    }

    setLoading(true);
    try {
    
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        dispatch(loginSuccess({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',  
          name: userData.name || firebaseUser.displayName || 'Uporabnik',
          rating: userData.rating || 0,
          reviewsCount: userData.reviewsCount || 0,
          level: userData.level || 1,
          xp: userData.xp || 0,
          maxXp: userData.maxXp || 250,
          badges: userData.badges || [],
          followers: userData.followers || 0,
          following: userData.following || 0,
        }));
      } else {
        
        dispatch(loginSuccess({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',  
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Uporabnik',
          rating: 0,
          reviewsCount: 0,
          level: 1,
          xp: 0,
          maxXp: 250,
          badges: [],
          followers: 0,
          following: 0,
        }));
      }
    } catch (error: any) {
      Alert.alert('Napaka pri prijavi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://picsum.photos/seed/shareflow/200/200' }} style={styles.logo} />
      <Text style={styles.title}>Dobrodošli v ShareFlow</Text>
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
        placeholder="Geslo"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Prijavljanje...' : 'Prijava'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Nimaš računa? Registriraj se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    borderRadius: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1a1a1a',
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
    marginBottom: 10,
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