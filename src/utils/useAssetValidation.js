import {useState, useEffect} from 'react';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import useDebounce from './useDebounce';

// Base API URL
const BASE_URL = 'https://api.matorg.com/v1';

const useAssetValidation = (deviceId, isEditMode = false) => {
  const [deviceIdValidating, setDeviceIdValidating] = useState(false);
  const [deviceIdValid, setDeviceIdValid] = useState(null);
  const [deviceIdMessage, setDeviceIdMessage] = useState('');
  const [originalDeviceId, setOriginalDeviceId] = useState(null);
  const [lastValidatedDeviceId, setLastValidatedDeviceId] = useState(null);

  const debouncedDeviceId = useDebounce(deviceId, 800);

  // Set original device ID when in edit mode and deviceId is first loaded
  useEffect(() => {
    if (isEditMode && deviceId && originalDeviceId === null) {
      setOriginalDeviceId(deviceId);
    }
  }, [isEditMode, deviceId, originalDeviceId]);

  // Validate device ID when debounced value changes
  useEffect(() => {
    // Skip validation if we've already validated this exact device ID
    if (debouncedDeviceId === lastValidatedDeviceId) {
      return;
    }

    // Only validate if:
    // 1. Not in edit mode (always validate for new assets)
    // 2. OR in edit mode but device ID has changed from original
    const hasChangedFromOriginal =
      isEditMode &&
      originalDeviceId !== null &&
      debouncedDeviceId !== originalDeviceId;
    const shouldValidate = !isEditMode || hasChangedFromOriginal;

    if (shouldValidate && debouncedDeviceId && debouncedDeviceId.length > 3) {
      setLastValidatedDeviceId(debouncedDeviceId);
      validateDeviceId(debouncedDeviceId);
    } else if (!shouldValidate) {
      // In edit mode and device ID hasn't changed, don't validate
      setDeviceIdValid(null);
      setDeviceIdMessage('');
    } else {
      setDeviceIdValid(null);
      setDeviceIdMessage('');
    }
  }, [debouncedDeviceId, isEditMode, originalDeviceId, lastValidatedDeviceId]);

  // Validate Device ID
  const validateDeviceId = async deviceIdToValidate => {
    setDeviceIdValidating(true);
    setDeviceIdMessage('Validating device ID...');
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${BASE_URL}/chorus-api/validate-device`,
        {deviceId: deviceIdToValidate},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      const {isValid, message} = response.data;

      console.log(isValid, message, 'Device ID validation response:');

      setDeviceIdValid(isValid);
      setDeviceIdMessage(
        message || (isValid ? 'Device ID is valid' : 'Device ID is invalid'),
      );

      if (!isValid) {
        Alert.alert('Validation Error', message);
      }
    } catch (error) {
      console.error('Device ID validation error:', error);
      setDeviceIdValid(false);
      setDeviceIdMessage('Failed to validate device ID');
      Alert.alert(
        'Validation Error',
        'Failed to validate device ID. Please try again.',
      );
    } finally {
      setDeviceIdValidating(false);
    }
  };

  // Get validation state for device ID
  const getDeviceIdValidationState = () => {
    if (deviceIdValidating) return 'validating';
    if (deviceIdValid === true) return 'valid';
    if (deviceIdValid === false) return 'invalid';
    return null;
  };

  return {
    deviceIdValidating,
    deviceIdValid,
    deviceIdMessage,
    getDeviceIdValidationState,
  };
};

export default useAssetValidation;
