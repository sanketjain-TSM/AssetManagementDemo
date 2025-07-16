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

const QRScannerModal = ({
  visible,
  onClose,
  onScan,
  title = 'Scan QR Code',
  subtitle = 'Position the QR code within the frame',
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const tablet = isTablet();

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
      setScanned(false);
      setCameraError(false);
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
      // iOS permissions are handled by the library
      setHasPermission(true);
    }
  };

  const handleSuccess = e => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true);
    const scannedData = e.data;
    
    // Validate the scanned data
    if (scannedData && scannedData.trim()) {
      onScan(scannedData.trim());
      onClose();
    } else {
      Alert.alert('Invalid QR Code', 'Please scan a valid QR code');
      setScanned(false);
    }
  };

  const handleError = error => {
    console.log('QR Scanner Error:', error);
    setCameraError(true);
    Alert.alert('Scanner Error', 'Failed to initialize camera. Please try again.');
  };

  const handleCameraReady = () => {
    console.log('Camera is ready');
    setCameraError(false);
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: '#000',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
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
    cameraContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1,
    },
    scanFrame: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: tablet ? 300 : 250,
      height: tablet ? 300 : 250,
      marginLeft: -(tablet ? 150 : 125),
      marginTop: -(tablet ? 150 : 125),
      borderWidth: 2,
      borderColor: '#EF652B',
      backgroundColor: 'transparent',
      zIndex: 2,
    },
    cornerTL: {
      position: 'absolute',
      top: -2,
      left: -2,
      width: 20,
      height: 20,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: '#EF652B',
    },
    cornerTR: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 20,
      height: 20,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: '#EF652B',
    },
    cornerBL: {
      position: 'absolute',
      bottom: -2,
      left: -2,
      width: 20,
      height: 20,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: '#EF652B',
    },
    cornerBR: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: '#EF652B',
    },
    instructions: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 20,
      borderRadius: 10,
      zIndex: 3,
    },
    instructionText: {
      color: '#fff',
      fontSize: tablet ? 16 : 14,
      textAlign: 'center',
      lineHeight: 22,
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    errorText: {
      color: '#fff',
      fontSize: tablet ? 18 : 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#EF652B',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: tablet ? 16 : 14,
      fontWeight: '600',
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

  if (cameraError) {
    return (
      <Modal visible={visible} animationType="slide">
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Camera failed to initialize. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setCameraError(false);
              setHasPermission(null);
              requestCameraPermission();
            }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, {marginTop: 15, backgroundColor: '#666'}]}
            onPress={onClose}>
            <Text style={styles.retryButtonText}>Cancel</Text>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerText}>{title}</Text>
          </View>
        </View>

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          <QRCodeScanner
            onRead={handleSuccess}
            flashMode={RNCamera.Constants.FlashMode.auto}
            reactivate={true}
            reactivateTimeout={2000}
            showMarker={false}
            cameraStyle={styles.cameraContainer}
            containerStyle={styles.scannerContainer}
            cameraProps={{
              onMountError: handleError,
              onCameraReady: handleCameraReady,
              type: RNCamera.Constants.Type.back,
              captureAudio: false,
            }}
            fadeIn={true}
            checkAndroid6Permissions={true}
            permissionDialogTitle="Camera Permission"
            permissionDialogMessage="This app needs camera access to scan QR codes"
            buttonPositive="OK"
          />

          {/* Custom overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>{subtitle}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QRScannerModal; 