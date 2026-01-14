import {useState, useEffect} from 'react';
import {Alert, Keyboard} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useDataRefresh} from '../context/DataRefreshContext';

// Base API URL
const BASE_URL = 'https://api.matorg.com/v1';

const useAssetForm = (isEditMode, editAssetId, assetData) => {
  const {triggerAssetRefresh} = useDataRefresh();
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

  useEffect(() => {
    loadMasterData();
  }, []);

  // Prefill form after master data is loaded
  useEffect(() => {
    if (isEditMode && assetData && assetDescriptionOptions.length > 0) {
      prefillFormWithAssetData(assetData);
    }
  }, [isEditMode, assetData, assetDescriptionOptions]);

  // Auto-fill location when zone changes
  useEffect(() => {
    if (zone && zoneLocationMap[zone]) {
      setLastKnownLocation(zoneLocationMap[zone]);
    } else if (!isEditMode && zone) {
      setLastKnownLocation('');
    }
  }, [zone, zoneLocationMap, isEditMode]);

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
      const response = await axios.post(
        `${BASE_URL}/assets/upsert-description`,
        {id, description},
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
      if (modalMode === 'add') {
        // For add mode: Make API call with id = 0
        const response = await updateAssetDescription(0, value);

        setModalVisible(false);
        Alert.alert('Success', 'Asset description added successfully');

        // Refresh the asset descriptions list
        await loadAssetDescriptions();

        // Set the newly added item as selected
        // After refresh, find the item by name and set as selected
        const updatedDescriptions = await getAssetDescriptions();
        const newItem = updatedDescriptions.find(
          desc => desc.description === value,
        );
        if (newItem) {
          setAssetDescription(newItem.id);
        }
      } else {
        // For edit mode: Make API call with actual item ID
        const response = await updateAssetDescription(editingItemId, value);

        setModalVisible(false);
        Alert.alert('Success', 'Asset description updated successfully');

        // Refresh the asset descriptions list
        await loadAssetDescriptions();
      }
    } catch (error) {
      console.error('Modal submit error:', error);
      Alert.alert(
        'Error',
        `Failed to ${
          modalMode === 'add' ? 'add' : 'update'
        } asset description. Please try again.`,
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
  const prefillFormWithAssetData = data => {
    try {
      setDeviceId(data.deviceId?.trim() || '');
      setAssetId(data.tagNumber || '');

      // Find the description ID by matching the description text
      const descriptionOption = assetDescriptionOptions.find(
        option => option.label === data.description,
      );
      setAssetDescription(descriptionOption ? descriptionOption.value : '');

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
    } catch (error) {
      console.error('Error prefilling form:', error);
      Alert.alert('Error', 'Failed to load asset data.');
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
        const response = await axios.post(
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
        console.log(response, 'save response');
        return response;
      }
    } catch (error) {
      console.error('Save asset error:', error);
      // Re-throw the original error to preserve the API response
      throw error;
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
  };

  const handleSaveAsset = async deviceIdValid => {
    Keyboard.dismiss();
    console.log(assetDescription, 'Asset Description');

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
    if (!assetDescription) {
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
      // Find the description text from the selected ID
      const selectedDescription = assetDescriptionOptions.find(
        option => option.value === assetDescription,
      );
      const descriptionText = selectedDescription
        ? selectedDescription.label
        : '';

      const assetDataToSave = {
        deviceId: deviceId.trim(),
        tagNumber: assetId.trim(),
        description: descriptionText,
        zoneId: zone.trim(),
        lastLocation: lastKnownLocation.trim(),
        lastSeenTime: Date.now().toLocaleString(),
      };

      console.log('Save asset response:', assetDataToSave);
      const response = await saveAsset(assetDataToSave, isEditMode);
      console.log(response, 'response');
      if (response.status === 200 || response.status === 201) {
        // Trigger data refresh across the app with delay to prevent freezing
        setTimeout(() => {
          triggerAssetRefresh();
        }, 500);

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
              }
              return true; // Indicate success to parent component
            },
          },
        ]);
        return true;
      } else {
        Alert.alert(
          'Error',
          `Failed to ${isEditMode ? 'update' : 'add'} asset.`,
        );
        return false;
      }
    } catch (error) {
      console.error('Save asset error:', error);
      console.error('Error response:', error.response?.data);

      // Extract error message from API response
      let errorMessage = `Failed to ${
        isEditMode ? 'update' : 'add'
      } asset. Please try again.`;

      if (error.response?.data?.error?.message) {
        // For the structure: { error: { message: "Asset already exists" } }
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        // For the structure: { message: "Some error message" }
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes('Network Error')) {
        // For general error messages (but not network errors)
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Form state
    deviceId,
    assetId,
    assetDescription,
    zone,
    lastKnownLocation,
    loading,
    initialLoading,

    // Master data
    assetDescriptionOptions,
    zoneOptions,
    zoneLocationMap,

    // Modal state
    modalVisible,
    modalMode,
    modalInitialValue,
    modalLoading,
    editingItemId,
    descriptionsLoading,

    // Handlers
    setDeviceId,
    setAssetId,
    setAssetDescription,
    setZone,
    setLastKnownLocation,
    handleDeviceIdChange,
    handleSaveAsset,
    handleAddNew,
    handleEdit,
    handleModalSubmit,
    handleModalClose,
    loadAssetDescriptions,
  };
};

export default useAssetForm;
