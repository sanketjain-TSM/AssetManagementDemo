import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Platform,
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

const SimpleQRScanner = ({
  visible,
  onClose,
  onScan,
  title = 'Scan QR Code',
  subtitle = 'Position the QR code within the frame',
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const tablet = isTablet();

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to scan QR codes',
          );
        }
      } catch (err) {
        console.warn(err);
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const handleSuccess = e => {
    if (scanned) return;
    
    setScanned(true);
    const scannedData = e.data;
    
    if (scannedData && scannedData.trim()) {
      onScan(scannedData.trim());
      onClose();
    } else {
      Alert.alert('Invalid QR Code', 'Please scan a valid QR code');
      setScanned(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: '#000',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    backButton: {
      padding: 10,
      marginRight: 15,
    },
    headerText: {
      color: '#fff',
      fontSize: tablet ? 20 : 18,
      fontWeight: '600',
    },
    scannerContainer: {
      flex: 1,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    permissionText: {
      color: '#fff',
      fontSize: tablet ? 18 : 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    permissionButton: {
      backgroundColor: '#EF652B',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 8,
    },
    permissionButtonText: {
      color: '#fff',
      fontSize: tablet ? 16 : 14,
      fontWeight: '600',
    },
    instructions: {
      position: 'absolute',
      bottom: 50,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 20,
      borderRadius: 10,
    },
    instructionText: {
      color: '#fff',
      fontSize: tablet ? 16 : 14,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  if (!visible) return null;

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, {marginTop: 15, backgroundColor: '#666'}]}
            onPress={onClose}>
            <Text style={styles.permissionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.modalOverlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>{title}</Text>
        </View>

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          <QRCodeScanner
            onRead={handleSuccess}
            flashMode={RNCamera.Constants.FlashMode.auto}
            reactivate={true}
            reactivateTimeout={2000}
            showMarker={true}
            markerStyle={{
              borderColor: '#EF652B',
              borderRadius: 10,
            }}
            topContent={
              <Text style={styles.instructionText}>{subtitle}</Text>
            }
            bottomContent={
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                  Point your camera at a QR code
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default SimpleQRScanner; 