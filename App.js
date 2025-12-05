import React, {useEffect, useState} from 'react';
import {FilterProvider} from './src/context/FilterContext';
import AppNavigator from './src/navigation/AppNavigator';

import {View, Text, Linking, Platform, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import axios from 'axios';
import {DevicesProvider, useDevicesContext} from './src/context/DeviceContext';

const App = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');

  // const { devices } = useDevicesContext();

  const checkForUpdate = async () => {
    try {
      axios.get('https://api.matorg.com/v1/auth/app/version').then(data => {
        const version = data?.data?.latestVersion;
        const currentVersion = '2';
        // Compare current version with the latest version from the API
        if (version !== currentVersion) {
          setIsUpdateAvailable(true);
          setLatestVersion(version);
          setModalVisible(true); // Show modal when update is available
        }
      });
    } catch (error) {
      console.log('Error checking for update:', error);
    }
  };

  useEffect(() => {
    // checkForUpdate();
  }, []);

  const handleUpdate = () => {
    if (Platform.OS === 'ios') {
      const testFlightUrl = `https://apps.apple.com/app/6742051733`;
      Linking.canOpenURL(testFlightUrl)
        .then(supported => {
          if (supported) {
            Linking.openURL(testFlightUrl);
          } else {
            Linking.openURL(appStoreUrl);
          }
        })
        .catch(err => console.error('Failed to open TestFlight link:', err));
    } else if (Platform.OS === 'android') {
      const apkUrl =
        'https://play.google.com/store/apps/details?id=com.sanketjn18.mynewapp';

      Linking.openURL(apkUrl).catch(err =>
        console.error('Failed to download', err),
      );
    }
  };

  return (
    <FilterProvider>
      {isModalVisible && (
        <View style={styles.container}>
          {/* Modal for update notification */}
          <Modal
            isVisible={isModalVisible}
            animationIn="slideInUp"
            animationOut="slideOutDown">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Update Available!</Text>
              <Text style={styles.modalMessage}>
                A new version {latestVersion} of the app is available. Please
                {Platform.OS === 'ios'
                  ? ' update through App Store to continue'
                  : ' update through Play Store to continue'}
              </Text>

              <View style={styles.updateButton}>
                <Text style={styles.updateButtonText} onPress={handleUpdate}>
                  Update Now
                </Text>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {!isModalVisible && (
        <DevicesProvider>
          <AppNavigator />
        </DevicesProvider>
      )}
    </FilterProvider>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  updateButton: {
    color: '#EF652B',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF652B',
  },
  updateButtonText: {
    color: '#ffffff',
  },
});
export default App;
