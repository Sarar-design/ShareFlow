import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';


import AuthStack from './AuthStack';


import MainTabs from './MainTabs';


import ChatDetailScreen from '../screens/stack/ChatDetailScreen';
import EditItemScreen from '../screens/stack/EditItemScreen';
import EventDetailScreen from '../screens/stack/EventDetailScreen';
import ItemDetailScreen from '../screens/stack/ItemDetailScreen';
import LikesScreen from '../screens/stack/LikesScreen';
import MyItemsScreen from '../screens/stack/MyItemsScreen';
import MyReservationsScreen from '../screens/stack/MyReservationsScreen';
import RateUserScreen from '../screens/stack/RateUserScreen';
import ReservationScreen from '../screens/stack/ReservationScreen';
import UserProfileScreen from '../screens/stack/UserProfileScreen';
import WriteReviewScreen from '../screens/stack/WriteReviewScreen';

export type RootStackParamList = {
  
  Auth: undefined;
  Login: undefined;
  Register: undefined;

  
  Main: undefined;
  Domov: undefined;
  Išči: undefined;
  Dodaj: undefined;
  Sporočila: undefined;
  Profil: undefined;

  
  ItemDetail: { id: string };
  Reservation: { itemId: string };
  EventDetail: { id: string };
  UserProfile: { id: string };
  ChatDetail: { chatId: string; receiverId: string; userName: string; itemId?: string };
  MyReservations: undefined;
  MyItems: undefined;
  EditItem: { itemId: string };
  Likes: undefined;
  WriteReview: { userId: string; userName: string };
  RateUser: { userId: string; reservationId: string; userName: string; itemTitle: string };
  QRCodeDisplay: { qrCode: string; itemTitle: string; userName: string };
};


const Stack = createNativeStackNavigator<RootStackParamList>();


export default function RootNavigator() {
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Navigator
        screenOptions={{
          headerBackTitle: 'Nazaj',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isLoggedIn ? (
          
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ headerShown: false }}
          />
        ) : (
          
          <>
            
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />

            
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{ title: 'Podrobnosti' }}
            />
            <Stack.Screen
              name="Reservation"
              component={ReservationScreen}
              options={{ title: 'Rezervacija' }}
            />
            <Stack.Screen
              name="EventDetail"
              component={EventDetailScreen}
              options={{ title: 'Dogodek' }}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{ title: 'Profil uporabnika' }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ title: 'Klepet' }}
            />
            <Stack.Screen
              name="MyReservations"
              component={MyReservationsScreen}
              options={{ title: 'Moje rezervacije' }}
            />
            <Stack.Screen
              name="MyItems"
              component={MyItemsScreen}
              options={{ title: 'Moji oglasi' }}
            />
            <Stack.Screen
              name="EditItem"
              component={EditItemScreen}
              options={{ title: 'Uredi oglas' }}
            />
            
            <Stack.Screen
  name="Likes"
  component={LikesScreen}
  options={{ title: 'Všečki' }}
/>
            <Stack.Screen
  name="WriteReview"
  component={WriteReviewScreen}
  options={{ title: 'Napiši mnenje' }}
/>
            <Stack.Screen
              name="RateUser"
              component={RateUserScreen}
              options={{ title: 'Oceni uporabnika' }}
            />
            
          </>
        )}
      </Stack.Navigator>
    </SafeAreaView>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
});