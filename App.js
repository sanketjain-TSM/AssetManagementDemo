import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { DevicesProvider } from './src/context/DeviceContext';

function App() {
  return (
    <DevicesProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </SafeAreaView>
    </DevicesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App; 