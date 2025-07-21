import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {TouchableWithoutFeedback} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

const AssetDescriptionModal = ({
  visible,
  onClose,
  onSubmit,
  initialValue = '',
  mode = 'add', // 'add' or 'edit'
  loading = false,
}) => {
  const [value, setValue] = useState(initialValue);
  const tablet = isTablet();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, visible]);

  const handleSubmit = () => {
    if (!value.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }
    onSubmit(value.trim());
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      width: tablet ? widthPercentageToDP(50) : widthPercentageToDP(90),
      maxWidth: 500,
    },
    modalTitle: {
      fontSize: tablet ? 20 : 18,
      fontWeight: '600',
      marginBottom: 20,
      textAlign: 'center',
      color: '#333',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: tablet ? 16 : 14,
      fontWeight: '500',
      marginBottom: 8,
      color: '#333',
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: tablet ? 15 : 12,
      fontSize: tablet ? 16 : 14,
      backgroundColor: '#f9f9f9',
      color: '#0E0E0E',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    button: {
      flex: 1,
      paddingVertical: tablet ? 15 : 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#EF652B',
    },
    secondaryButton: {
      backgroundColor: '#f0f0f0',
      borderWidth: 1,
      borderColor: '#ddd',
    },
    buttonText: {
      fontSize: tablet ? 16 : 14,
      fontWeight: '500',
    },
    primaryButtonText: {
      color: '#fff',
    },
    secondaryButtonText: {
      color: '#333',
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {mode === 'add' ? 'Add New Description' : 'Edit Description'}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description/Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={setValue}
                  placeholder="Enter asset description"
                  autoFocus={true}
                  multiline={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={onClose}
                  disabled={loading}>
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    loading && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>
                      {mode === 'add' ? 'Add' : 'Update'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default AssetDescriptionModal;
