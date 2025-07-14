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
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
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
const BASE_URL = 'https://api.matorg.com/v1';

// ✅ Custom hook moved OUTSIDE the component
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

// Asset Description Modal Component
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

// Global dropdown state management
let globalDropdownOpen = null;

// Enhanced Dropdown Component - Connected with Outside Click
const EnhancedDropdown = ({
  label,
  value,
  onSelect,
  items,
  placeholder,
  onAddNew,
  onEdit,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tablet = isTablet();

  const selectedItem = items.find(item => item.value === value);

  const handleItemPress = item => {
    if (item.isAddNew) {
      onAddNew();
    } else {
      onSelect(item.value);
      setIsOpen(false);
      globalDropdownOpen = null;
    }
  };

  // Global dropdown management
  const handleDropdownToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      globalDropdownOpen = null;
    } else {
      // Close any other open dropdown
      if (globalDropdownOpen && globalDropdownOpen !== 'assetDescription') {
        globalDropdownOpen = null;
      }
      setIsOpen(true);
      globalDropdownOpen = 'assetDescription';
    }
  };

  // Close dropdown when another one opens
  useEffect(() => {
    if (
      globalDropdownOpen &&
      globalDropdownOpen !== 'assetDescription' &&
      isOpen
    ) {
      setIsOpen(false);
    }
  }, [globalDropdownOpen, isOpen]);

  // Close dropdown on outside click
  const handleOutsideClick = () => {
    if (isOpen) {
      setIsOpen(false);
      globalDropdownOpen = null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
      // Add z-index to the container when dropdown is open
      zIndex: isOpen ? 9999 : 1,
      elevation: isOpen ? 10 : 1,
    },
    label: {
      fontSize: tablet ? 16 : 14,
      fontWeight: '500',
      marginBottom: 8,
      color: '#333',
    },
    // Add relative positioning to the dropdown wrapper
    dropdownWrapper: {
      position: 'relative',
      zIndex: isOpen ? 9999 : 1,
      backgroundColor: '#fff',
    },
    dropdownButton: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: tablet ? 15 : 12,
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // When dropdown is open, modify border radius to connect with dropdown
      ...(isOpen && {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomColor: 'transparent',
      }),
    },
    dropdownText: {
      fontSize: tablet ? 16 : 14,
      color: selectedItem ? '#333' : '#999',
      flex: 1,
    },
    dropdownArrow: {
      width: 12,
      height: 12,
      tintColor: '#666',
    },
    dropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#ddd',
      borderTopWidth: 0, // Remove top border to connect with button
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      marginTop: 0, // Remove gap to make it connected
      maxHeight: 200,
      zIndex: 99999,
      elevation: 15,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 8,
      // Platform specific shadow
      ...(Platform.OS === 'ios' && {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
      }),
      ...(Platform.OS === 'android' && {
        elevation: 15,
      }),
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      backgroundColor: '#ffffff',
    },
    lastDropdownItem: {
      borderBottomWidth: 0,
    },
    addNewItem: {
      backgroundColor: '#f8f9fa',
      borderTopWidth: 1,
      borderTopColor: '#e9ecef',
    },
    dropdownItemText: {
      fontSize: tablet ? 16 : 14,
      color: '#333',
      flex: 1,
    },
    addNewText: {
      color: '#EF652B',
      fontWeight: '500',
    },
    editButton: {
      backgroundColor: '#EF652B',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginLeft: 10,
    },
    editButtonText: {
      color: '#fff',
      fontSize: tablet ? 12 : 10,
      fontWeight: '500',
    },
    selectedItem: {
      backgroundColor: '#f0f8ff',
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: '#ffffff',
    },
    // Overlay to capture outside clicks
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9998,
    },
  });

  const dropdownItems = [
    {
      label: '+ Add New Description',
      value: 'add_new',
      isAddNew: true,
    },
    ...items,
  ];

  return (
    <>
      {/* Overlay to handle outside clicks */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={handleDropdownToggle}
            disabled={loading}>
            <Text
              style={[
                styles.dropdownText,
                {color: selectedItem ? '#333' : '#999'},
              ]}>
              {selectedItem ? selectedItem.label : placeholder}
            </Text>
            {/* Add a simple arrow indicator */}
            <Text
              style={{
                fontSize: 16,
                color: '#666',
                transform: [{rotate: isOpen ? '180deg' : '0deg'}],
              }}>
              ▼
            </Text>
          </TouchableOpacity>

          {isOpen && (
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.dropdownList}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#EF652B" />
                  </View>
                ) : (
                  <FlatList
                    data={dropdownItems}
                    keyExtractor={item => item.value.toString()}
                    renderItem={({item, index}) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          index === dropdownItems.length - 1 &&
                            styles.lastDropdownItem,
                          item.isAddNew && styles.addNewItem,
                          item.value === value && styles.selectedItem,
                        ]}
                        onPress={() => handleItemPress(item)}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            item.isAddNew && styles.addNewText,
                          ]}>
                          {item.label}
                        </Text>
                        {!item.isAddNew && (
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => onEdit(item)}>
                            <Text style={styles.editButtonText}>Edit</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    )}
                    nestedScrollEnabled={true}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    </>
  );
};

export default function AddAssetScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Check if in edit mode and get asset data
  const isEditMode = route.params?.mode === 'edit';
  const editAssetId = route.params?.assetId;
  const assetData = route.params?.assetData;

  const [deviceId, setDeviceId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [zone, setZone] = useState('');
  const [lastKnownLocation, setLastKnownLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Master data states
  const [assetDescriptionOptions, setAssetDescriptionOptions] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [zoneLocationMap, setZoneLocationMap] = useState({});

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [modalInitialValue, setModalInitialValue] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [descriptionsLoading, setDescriptionsLoading] = useState(false);

  console.log('Asset descriptions fetched:', assetDescriptionOptions);
  console.log('Zones', zoneOptions);

  // Validation states
  const [deviceIdValidating, setDeviceIdValidating] = useState(false);
  const [deviceIdValid, setDeviceIdValid] = useState(null);
  const [deviceIdMessage, setDeviceIdMessage] = useState('');

  const tablet = isTablet();

  // ✅ Now using the hook that's defined outside the component
  const debouncedDeviceId = useDebounce(deviceId, 800);

  useEffect(() => {
    loadMasterData();
    if (isEditMode && assetData) {
      prefillFormWithAssetData(assetData);
    }
  }, []);

  // Validate device ID when debounced value changes
  useEffect(() => {
    if (debouncedDeviceId && debouncedDeviceId.length > 3) {
      validateDeviceId(debouncedDeviceId);
    } else {
      setDeviceIdValid(null);
      setDeviceIdMessage('');
    }
  }, [debouncedDeviceId]);

  // Auto-fill location when zone changes
  useEffect(() => {
    if (zone && zoneLocationMap[zone]) {
      setLastKnownLocation(zoneLocationMap[zone]);
    } else if (!isEditMode && zone) {
      setLastKnownLocation('');
    }
  }, [zone, zoneLocationMap, isEditMode]);

  // API Functions for Asset Descriptions
  const createAssetDescription = async description => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}/assets/description/create`,
        {description},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      return response.data;
    } catch (error) {
      console.error('Create asset description error:', error);
      throw new Error('Failed to create asset description');
    }
  };

  const updateAssetDescription = async (id, description) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}/assets/description/update/${id}`,
        {description},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      return response.data;
    } catch (error) {
      console.error('Update asset description error:', error);
      throw new Error('Failed to update asset description');
    }
  };

  // Modal handlers
  const handleAddNew = () => {
    setModalMode('add');
    setModalInitialValue('');
    setEditingItemId(null);
    setModalVisible(true);
  };

  const handleEdit = item => {
    setModalMode('edit');
    setModalInitialValue(item.label);
    setEditingItemId(item.value);
    setModalVisible(true);
  };

  const handleModalSubmit = async value => {
    setModalLoading(true);
    try {
      let response;
      if (modalMode === 'add') {
        response = await createAssetDescription(value);
        Alert.alert('Success', 'Asset description added successfully');
      } else {
        response = await updateAssetDescription(editingItemId, value);
        Alert.alert('Success', 'Asset description updated successfully');
      }

      // Refresh the asset descriptions
      await loadAssetDescriptions();
      setModalVisible(false);

      // If we're adding a new item, select it
      if (modalMode === 'add' && response.data?.id) {
        setAssetDescription(response.data.id);
      }
    } catch (error) {
      console.error('Modal submit error:', error);
      Alert.alert(
        'Error',
        `Failed to ${modalMode} asset description. Please try again.`,
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setModalInitialValue('');
    setEditingItemId(null);
  };

  // Load asset descriptions separately for refresh
  const loadAssetDescriptions = async () => {
    setDescriptionsLoading(true);
    try {
      const descriptions = await getAssetDescriptions();
      setAssetDescriptionOptions(
        descriptions?.map(d => ({
          label: d.description,
          value: d.id,
        })) || [],
      );
    } catch (error) {
      console.error('Load asset descriptions error:', error);
    } finally {
      setDescriptionsLoading(false);
    }
  };

  // Prefill form with passed asset data
  const prefillFormWithAssetData = async data => {
    try {
      setDeviceId(data.deviceId?.trim() || '');
      setAssetId(data.tagNumber || '');
      setAssetDescription(data.description || '');
      setZone(data.zoneId || '');

      const locationText =
        data.floor && data.department
          ? `${ordinalSuffixOf(data.floor)}${
              data.department?.toLowerCase() !== 'unknown'
                ? `, ${data.department}`
                : ''
            }`
          : '';
      setLastKnownLocation(locationText);

      if (data.deviceId?.trim()) {
        setDeviceIdValid(true);
        setDeviceIdMessage('Device ID is valid');
      }
    } catch (error) {
      console.error('Error prefilling form:', error);
      Alert.alert('Error', 'Failed to load asset data.');
    }
  };

  // Helper function to format floor text
  function ordinalSuffixOf(i) {
    if (i?.toLowerCase() === 'notinzone') {
      return i;
    }
    i = Number(i);
    let j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + 'st Floor';
    }
    if (j == 2 && k != 12) {
      return i + 'nd Floor';
    }
    if (j == 3 && k != 13) {
      return i + 'rd Floor';
    }
    return i + 'th Floor';
  }

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

  // Get Asset Descriptions master data
  const getAssetDescriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(`${BASE_URL}/assets/all/description`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log(response, ' Asset descriptions response:');
      if (response.status === 200) {
        console.log('Asset descriptions fetched:', response.data);
        return response.data.data || response.data;
      }
      return [];
    } catch (error) {
      console.error('Asset descriptions fetch error:', error);
      throw new Error('Failed to fetch asset descriptions');
    }
  };

  // Get Zones master data with their respective locations
  const getZones = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(`${BASE_URL}/assets/zones/all`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (response.status === 200) {
        console.log('Zones fetched:', response.data);
        const zonesData = response.data.data || response.data;

        const locationMap = {};
        const zoneDropdownItems = [];

        Object.entries(zonesData).forEach(([zoneId, location]) => {
          locationMap[zoneId] = location;
          zoneDropdownItems.push({
            label: zoneId,
            value: zoneId,
          });
        });

        setZoneLocationMap(locationMap);
        return zoneDropdownItems;
      }

      return [];
    } catch (error) {
      console.error('Zones fetch error:', error);
      throw new Error('Failed to fetch zones');
    }
  };

  // Add or Update Asset
  const saveAsset = async (assetData, isEdit = false) => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (isEdit) {
        const response = await axios.put(
          `${BASE_URL}/assets/update-asset/${editAssetId}`,
          assetData,
          {headers: {Authorization: `Bearer ${token}`}},
        );
        return response;
      } else {
        const response = await axios.post(
          `${BASE_URL}/assets/create-asset`,
          assetData,
          {headers: {Authorization: `Bearer ${token}`}},
        );
        return response;
      }
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

      console.log('Master data loaded:', descriptions, zones);

      setAssetDescriptionOptions(
        descriptions?.map(d => ({
          label: d.description,
          value: d.id,
        })) || [],
      );
      setZoneOptions(zones);
    } catch (error) {
      Alert.alert('Error', 'Failed to load master data.');
      console.error('Master data loading error:', error);
    }
  };

  const handleDeviceIdChange = text => {
    setDeviceId(text);
    setDeviceIdValid(null);
    setDeviceIdMessage('');
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
      Alert.alert('Error', 'Last Known Location is required.');
      return;
    }

    setLoading(true);
    try {
      const assetDataToSave = {
        deviceId: deviceId.trim(),
        assetId: assetId.trim(),
        assetDescription: assetDescription.trim(),
        zone: zone.trim(),
        lastKnownLocation: lastKnownLocation.trim(),
      };

      const response = await saveAsset(assetDataToSave, isEditMode);

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
                setDeviceId('');
                setAssetId('');
                setAssetDescription('');
                setZone('');
                setLastKnownLocation('');
                setDeviceIdValid(null);
                setDeviceIdMessage('');
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

  // Get validation state for device ID
  const getDeviceIdValidationState = () => {
    if (deviceIdValidating) return 'validating';
    if (deviceIdValid === true) return 'valid';
    if (deviceIdValid === false) return 'invalid';
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
    <SafeAreaView style={{flex: 1}}>
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
              storageKey="deviceId"
              validationState={getDeviceIdValidationState()}
              validationMessage={deviceIdMessage}
              showValidationIcon={true}
            />

            <DynamicInputField
              label="Asset ID"
              value={assetId}
              onChangeText={setAssetId}
              placeholder="Scan barcode or QR code"
              storageKey="assetId"
            />

            <EnhancedDropdown
              label="Asset Description/Name"
              value={assetDescription}
              onSelect={setAssetDescription}
              items={assetDescriptionOptions}
              placeholder="Select asset description or name"
              onAddNew={handleAddNew}
              onEdit={handleEdit}
              loading={descriptionsLoading}
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
                zone
                  ? 'Location will be auto-filled based on zone'
                  : 'Select a zone first'
              }
              editable={false}
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

      <AssetDescriptionModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialValue={modalInitialValue}
        mode={modalMode}
        loading={modalLoading}
      />
    </SafeAreaView>
  );
}
