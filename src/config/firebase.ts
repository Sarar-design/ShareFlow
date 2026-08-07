
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyCltC7mN0Ya5Ncyo9VokgjM9TOiFllYMLw",
  authDomain: "shareflow-demo.firebaseapp.com",
  projectId: "shareflow-demo",
  storageBucket: "shareflow-demo.firebasestorage.app",
  messagingSenderId: "268729113140",
  appId: "1:268729113140:web:95dfab2adb5b7320c24861"

};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
