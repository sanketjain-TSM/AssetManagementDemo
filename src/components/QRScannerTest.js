import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import QRScannerModal from './QRScannerModal';

const QRScannerTest = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState('');

  const handleScan = (data) => {
    setScannedData(data);
    Alert.alert('QR Code Scanned', `Scanned data: ${data}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Scanner Test</Text>
      
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}>
        <Text style={styles.scanButtonText}>Open QR Scanner</Text>
      </TouchableOpacity>

      {scannedData ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Last Scanned:</Text>
          <Text style={styles.resultText}>{scannedData}</Text>
        </View>
      ) : null}

      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Test QR Scanner"
        subtitle="Scan any QR code to test"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#EF652B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default QRScannerTest; 