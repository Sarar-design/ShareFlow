import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
});