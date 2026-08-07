import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import RootNavigator from '../src/navigation/RootNavigator';
import { store } from '../src/store';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
       <SafeAreaProvider>
      <Provider store={store}>
        <RootNavigator />
      </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}