import Icon from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AddScreen from '../screens/main/AddScreen';
import HomeScreen from '../screens/main/HomeScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SearchScreen from '../screens/main/SearchScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <SafeAreaView style={styles.safeArea}> 
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          if (route.name === 'Domov') iconName = 'home-outline';
          else if (route.name === 'Išči') iconName = 'search-outline';
          else if (route.name === 'Dodaj') iconName = 'add-circle-outline';
          else if (route.name === 'Sporočila') iconName = 'chatbubble-outline';
          else if (route.name === 'Profil') iconName = 'person-outline';
          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Domov" component={HomeScreen} />
      <Tab.Screen name="Išči" component={SearchScreen} />
      <Tab.Screen name="Dodaj" component={AddScreen} />
      <Tab.Screen name="Sporočila" component={MessagesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});