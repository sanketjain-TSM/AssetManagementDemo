import React, {useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DynamicInputField from '../components/DynamicInputField';
import {TouchableWithoutFeedback} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

// Base API URL
const BASE_URL = 'http://34.57.92.8:8000/v1';

// Mock data for development
const MOCK_DATA = {
  assetDescriptions: [
    {label: 'Ventilator - Model A', value: 'ventilator_model_a'},
    {label: 'X-Ray Machine - Digital', value: 'xray_machine_digital'},
    {label: 'Hospital Bed - Standard', value: 'hospital_bed_standard'},
    {label: 'Defibrillator - Portable', value: 'defibrillator_portable'},
    {label: 'Ultrasound Machine', value: 'ultrasound_machine'},
    {label: 'ECG Monitor', value: 'ecg_monitor'},
    {label: 'Infusion Pump', value: 'infusion_pump'},
    {label: 'Wheelchair - Electric', value: 'wheelchair_electric'},
  ],
  zones: [
    {label: 'Zone A - ICU', value: 'zone_a_icu'},
    {label: 'Zone B - Emergency', value: 'zone_b_emergency'},
    {label: 'Zone C - Surgery', value: 'zone_c_surgery'},
    {label: 'Zone D - General Ward', value: 'zone_d_general'},
    {label: 'Zone E - Pharmacy', value: 'zone_e_pharmacy'},
    {label: 'Zone F - Laboratory', value: 'zone_f_laboratory'},
  ],
  locationsByZone: {
    zone_a_icu: [
      {label: 'ICU Room 101', value: 'icu_room_101'},
      {label: 'ICU Room 102', value: 'icu_room_102'},
      {label: 'ICU Corridor A', value: 'icu_corridor_a'},
    ],
    zone_b_emergency: [
      {label: 'Emergency Bay 1', value: 'emergency_bay_1'},
      {label: 'Emergency Bay 2', value: 'emergency_bay_2'},
      {label: 'Triage Area', value: 'triage_area'},
    ],
    zone_c_surgery: [
      {label: 'Operating Room 1', value: 'operating_room_1'},
      {label: 'Operating Room 2', value: 'operating_room_2'},
      {label: 'Pre-Op Area', value: 'pre_op_area'},
      {label: 'Recovery Room', value: 'recovery_room'},
    ],
    zone_d_general: [
      {label: 'Ward Room 201', value: 'ward_room_201'},
      {label: 'Ward Room 202', value: 'ward_room_202'},
      {label: 'Nurses Station', value: 'nurses_station'},
    ],
    zone_e_pharmacy: [
      {label: 'Main Pharmacy', value: 'main_pharmacy'},
      {label: 'Pharmacy Storage', value: 'pharmacy_storage'},
    ],
    zone_f_laboratory: [
      {label: 'Lab Room A', value: 'lab_room_a'},
      {label: 'Lab Room B', value: 'lab_room_b'},
      {label: 'Sample Storage', value: 'sample_storage'},
    ],
  },
  assetDetails: {
    AST001234: {
      deviceId: 'DEV001234',
      assetId: 'AST001234',
      assetDescription: 'ventilator_model_a',
      zone: 'zone_a_icu',
      lastKnownLocation: 'icu_room_101',
    },
  },
};

export default function AddAssetScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Check if in edit mode and get asset ID
  const isEditMode = route.params?.mode === 'edit';
  const editAssetId = route.params?.assetId;

  const [deviceId, setDeviceId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [zone, setZone] = useState('');
  const [lastKnownLocation, setLastKnownLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Master data states
  const [assetDescriptionOptions, setAssetDescriptionOptions] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);

  // Loading states for specific operations
  const [deviceIdValidating, setDeviceIdValidating] = useState(false);
  const [deviceIdValid, setDeviceIdValid] = useState(null);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const tablet = isTablet();

  // Debounce hook for device ID validation
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedDeviceId = useDebounce(deviceId, 800); // 800ms delay

  useEffect(() => {
    loadMasterData();
    if (isEditMode && editAssetId) {
      loadAssetDetails();
    }
  }, []);

  // Validate device ID when debounced value changes
  useEffect(() => {
    if (debouncedDeviceId && debouncedDeviceId.length > 3) {
      validateDeviceId(debouncedDeviceId);
    } else {
      setDeviceIdValid(null);
    }
  }, [debouncedDeviceId]);

  // Load locations when zone changes
  useEffect(() => {
    if (zone) {
      loadLocationsByZone(zone);
      // Clear location if zone changes and it's not the initial load
      if (lastKnownLocation && !initialLoading) {
        setLastKnownLocation('');
      }
    } else {
      setLocationOptions([]);
      if (!initialLoading) {
        setLastKnownLocation('');
      }
    }
  }, [zone]);

  // Validate Device ID
  const validateDeviceId = async deviceIdToValidate => {
    setDeviceIdValidating(true);
    try {
      const token = await AsyncStorage.getItem('token');

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

      // Mock validation logic
      const isValid =
        deviceIdToValidate.startsWith('DEV') && deviceIdToValidate.length >= 6;

      if (isValid) {
        setDeviceIdValid(true);
      } else {
        setDeviceIdValid(false);
        Alert.alert(
          'Validation Error',
          'Invalid Device ID format. Device ID should start with "DEV" and be at least 6 characters long.',
        );
      }

      // Actual API call would be:
      // const response = await axios.post(
      //   `${BASE_URL}/devices/validate`,
      //   { deviceId: deviceIdToValidate },
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // if (response.status === 200) {
      //   setDeviceIdValid(response.data.valid);
      //   if (!response.data.valid) {
      //     Alert.alert('Validation Error', response.data.message);
      //   }
      // }
    } catch (error) {
      console.error('Device ID validation error:', error);
      setDeviceIdValid(false);
      Alert.alert(
        'Validation Error',
        'Failed to validate device ID. Please try again.',
      );
    } finally {
      setDeviceIdValidating(false);
    }
  };

  // Get Asset Descriptions master data
  const getAssetDescriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      return MOCK_DATA.assetDescriptions;

      // Actual API call would be:
      // const response = await axios.get(
      //   `${BASE_URL}/master-data/asset-descriptions`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // if (response.status === 200) {
      //   return response.data.data || response.data;
      // }
      // return [];
    } catch (error) {
      console.error('Asset descriptions fetch error:', error);
      throw new Error('Failed to fetch asset descriptions');
    }
  };

  // Get Zones master data
  const getZones = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      return MOCK_DATA.zones;

      // Actual API call would be:
      // const response = await axios.get(
      //   `${BASE_URL}/master-data/zones`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // if (response.status === 200) {
      //   return response.data.data || response.data;
      // }
      // return [];
    } catch (error) {
      console.error('Zones fetch error:', error);
      throw new Error('Failed to fetch zones');
    }
  };

  // Get Locations based on Zone ID
  const getLocationsByZone = async zoneId => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
      return MOCK_DATA.locationsByZone[zoneId] || [];

      // Actual API call would be:
      // const response = await axios.get(
      //   `${BASE_URL}/master-data/locations?zoneId=${zoneId}`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // if (response.status === 200) {
      //   return response.data.data || response.data;
      // }
      // return [];
    } catch (error) {
      console.error('Locations fetch error:', error);
      throw new Error('Failed to fetch locations');
    }
  };

  // Get Asset Details for editing
  const getAssetDetails = async assetId => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
      return MOCK_DATA.assetDetails[assetId] || null;

      // Actual API call would be:
      // const response = await axios.get(
      //   `${BASE_URL}/assets/${assetId}`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // if (response.status === 200) {
      //   return response.data.data || response.data;
      // }
      // return null;
    } catch (error) {
      console.error('Asset details fetch error:', error);
      throw new Error('Failed to fetch asset details');
    }
  };

  // Add or Update Asset
  const saveAsset = async (assetData, isEdit = false) => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay

      return {
        status: isEdit ? 200 : 201,
        data: {
          success: true,
          message: isEdit
            ? 'Asset updated successfully'
            : 'Asset added successfully',
          data: assetData,
        },
      };

      // Actual API call would be:
      // if (isEdit) {
      //   const response = await axios.put(
      //     `${BASE_URL}/assets/${editAssetId}`,
      //     assetData,
      //     { headers: { Authorization: `Bearer ${token}` } }
      //   );
      //   return response;
      // } else {
      //   const response = await axios.post(
      //     `${BASE_URL}/assets/add`,
      //     assetData,
      //     { headers: { Authorization: `Bearer ${token}` } }
      //   );
      //   return response;
      // }
    } catch (error) {
      console.error('Save asset error:', error);
      throw new Error(`Failed to ${isEdit ? 'update' : 'add'} asset`);
    }
  };

  const loadMasterData = async () => {
    try {
      const [descriptions, zones] = await Promise.all([
        getAssetDescriptions(),
        getZones(),
      ]);

      setAssetDescriptionOptions(descriptions);
      setZoneOptions(zones);
    } catch (error) {
      Alert.alert('Error', 'Failed to load master data.');
      console.error('Master data loading error:', error);
    }
  };

  const loadAssetDetails = async () => {
    try {
      setInitialLoading(true);
      const assetDetails = await getAssetDetails(editAssetId);

      if (assetDetails) {
        // Prefill form with asset details
        setDeviceId(assetDetails.deviceId);
        setAssetId(assetDetails.assetId);
        setAssetDescription(assetDetails.assetDescription);
        setZone(assetDetails.zone);
        setLastKnownLocation(assetDetails.lastKnownLocation);
      } else {
        Alert.alert('Error', 'Asset not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load asset details.');
      console.error('Asset details loading error:', error);
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const loadLocationsByZone = async zoneId => {
    try {
      setLocationsLoading(true);
      const locations = await getLocationsByZone(zoneId);
      setLocationOptions(locations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load locations for selected zone.');
      console.error('Locations loading error:', error);
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleDeviceIdChange = text => {
    setDeviceId(text);
    setDeviceIdValid(null); // Reset validation state
  };

  const handleSaveAsset = async () => {
    Keyboard.dismiss();

    // Validation
    if (!deviceId.trim()) {
      Alert.alert('Error', 'Please enter a Device ID.');
      return;
    }
    if (deviceIdValid === false) {
      Alert.alert('Error', 'Please enter a valid Device ID.');
      return;
    }
    if (!assetId.trim()) {
      Alert.alert('Error', 'Please enter an Asset ID.');
      return;
    }
    if (!assetDescription.trim()) {
      Alert.alert('Error', 'Please select Asset Description/Name.');
      return;
    }
    if (!zone.trim()) {
      Alert.alert('Error', 'Please select a Zone.');
      return;
    }
    if (!lastKnownLocation.trim()) {
      Alert.alert('Error', 'Please select Last Known Location.');
      return;
    }

    setLoading(true);
    try {
      const assetData = {
        deviceId: deviceId.trim(),
        assetId: assetId.trim(),
        assetDescription: assetDescription.trim(),
        zone: zone.trim(),
        lastKnownLocation: lastKnownLocation.trim(),
      };

      const response = await saveAsset(assetData, isEditMode);

      if (response.status === 200 || response.status === 201) {
        const message =
          response.data?.message ||
          (isEditMode
            ? 'Asset updated successfully'
            : 'Asset added successfully');
        Alert.alert('Success', message, [
          {
            text: 'OK',
            onPress: () => {
              if (!isEditMode) {
                // Clear form only in add mode
                setDeviceId('');
                setAssetId('');
                setAssetDescription('');
                setZone('');
                setLastKnownLocation('');
                setDeviceIdValid(null);
              }
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          `Failed to ${isEditMode ? 'update' : 'add'} asset.`,
        );
      }
    } catch (error) {
      console.error('Save asset error:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEditMode ? 'update' : 'add'} asset. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIdValidationIcon = () => {
    if (deviceIdValidating) {
      return (
        <ActivityIndicator
          size="small"
          color="#EF652B"
          style={{marginRight: 8}}
        />
      );
    }
    if (deviceIdValid === true) {
      return <Text style={{color: 'green', marginRight: 8}}>✓</Text>;
    }
    if (deviceIdValid === false) {
      return <Text style={{color: 'red', marginRight: 8}}>✗</Text>;
    }
    return null;
  };

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: '#fff',
      paddingTop: Platform.OS === 'ios' ? 40 : 0,
      paddingHorizontal: tablet ? widthPercentageToDP(5) : 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tablet ? heightPercentageToDP(2) : 15,
    },
    headerText: {
      fontSize: tablet ? 26 : 20,
      fontWeight: '600',
      flex: 1,
      textAlign: 'left',
    },
    backButton: {marginLeft: tablet ? 20 : 15},
    backArrow: {
      width: tablet ? 44 : 36,
      height: tablet ? 44 : 36,
      marginRight: tablet ? 15 : 10,
      marginLeft: -10,
    },
    formContainer: {
      paddingVertical: tablet ? heightPercentageToDP(3) : 20,
    },
    button: {
      backgroundColor: '#EF652B',
      paddingVertical: tablet ? 18 : 15,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      width: tablet ? widthPercentageToDP(90) : widthPercentageToDP(90),
      marginBottom: tablet ? heightPercentageToDP(4) : 40,
      marginTop: tablet ? heightPercentageToDP(2) : 20,
    },
    buttonDisabled: {
      backgroundColor: '#CCC',
    },
    buttonText: {
      color: '#FFF',
      fontSize: tablet ? 20 : 18,
      fontWeight: '400',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 50,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#666',
    },
    validationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 5,
    },
  });

  if (initialLoading) {
    return (
      <View style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Image
              source={require('../../assets/images/backArrow.png')}
              style={styles.backArrow}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Asset</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF652B" />
          <Text style={styles.loadingText}>Loading asset details...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid
        extraScrollHeight={20}
        extraHeight={100}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Image
              source={require('../../assets/images/backArrow.png')}
              style={styles.backArrow}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {isEditMode ? 'Edit Asset' : 'Add Asset'}
          </Text>
        </View>
        <View style={styles.formContainer}>
          <DynamicInputField
            label="Device ID"
            value={deviceId}
            onChangeText={handleDeviceIdChange}
            placeholder="Scan or enter device ID"
            scannable={true}
            storageKey="deviceId"
          />
          <View style={styles.validationContainer}>
            {getDeviceIdValidationIcon()}
          </View>

          <DynamicInputField
            label="Asset ID"
            value={assetId}
            onChangeText={setAssetId}
            placeholder="Scan barcode or QR code"
            scannable={true}
            storageKey="assetId"
          />

          <DynamicInputField
            label="Asset Description/Name"
            value={assetDescription}
            onChangeText={setAssetDescription}
            placeholder="Select asset description or name"
            useDropdown={true}
            dropdownItems={assetDescriptionOptions}
          />

          <DynamicInputField
            label="Zone"
            value={zone}
            onChangeText={setZone}
            placeholder="Select zone"
            useDropdown={true}
            dropdownItems={zoneOptions}
          />

          <DynamicInputField
            label="Last Known Location"
            value={lastKnownLocation}
            onChangeText={setLastKnownLocation}
            placeholder={
              locationsLoading ? 'Loading locations...' : 'First Floor Biomedical'
            }
            useDropdown={false}
            dropdownItems={locationOptions}
            editable={!locationsLoading && locationOptions.length > 0}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSaveAsset}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isEditMode ? 'Update Asset' : 'Add Asset'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}
