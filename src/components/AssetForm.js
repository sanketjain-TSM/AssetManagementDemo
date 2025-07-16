import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import DynamicInputField from './DynamicInputField';
import EnhancedDropdown from './EnhancedDropdown';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

const AssetForm = ({
  // Form state
  deviceId,
  assetId,
  assetDescription,
  zone,
  lastKnownLocation,
  loading,

  // Master data
  assetDescriptionOptions,
  zoneOptions,

  // Validation
  deviceIdValidationState,
  deviceIdMessage,

  // Handlers
  onDeviceIdChange,
  onAssetIdChange,
  onAssetDescriptionChange,
  onZoneChange,
  onLastKnownLocationChange,
  onSaveAsset,
  onAddNewDescription,
  onEditDescription,
  descriptionsLoading,
  isEditMode = false,
}) => {
  const tablet = isTablet();

  const handleSaveAsset = () => {
    onSaveAsset();
  };

  const styles = StyleSheet.create({
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
  });

  return (
    <View style={styles.formContainer}>
      <DynamicInputField
        label="Device ID"
        value={deviceId}
        onChangeText={onDeviceIdChange}
        placeholder="Scan or enter device ID"
        storageKey="deviceId"
        validationState={deviceIdValidationState}
        validationMessage={deviceIdMessage}
        showValidationIcon={true}
        enableQRScan={true}
        qrScanTitle="Scan Device ID"
        qrScanSubtitle="Position the device ID QR code within the frame"
      />

      <DynamicInputField
        label="Asset ID"
        value={assetId}
        onChangeText={onAssetIdChange}
        placeholder="Scan barcode or QR code"
        storageKey="assetId"
        enableQRScan={true}
        qrScanTitle="Scan Asset ID"
        qrScanSubtitle="Position the asset ID QR code within the frame"
      />

      <EnhancedDropdown
        label="Asset Description/Name"
        value={assetDescription}
        onSelect={onAssetDescriptionChange}
        items={assetDescriptionOptions}
        placeholder="Select asset description or name"
        onAddNew={onAddNewDescription}
        onEdit={onEditDescription}
        loading={descriptionsLoading}
      />

      <DynamicInputField
        label="Zone"
        value={zone}
        onChangeText={onZoneChange}
        placeholder="Select zone"
        useDropdown={true}
        dropdownItems={zoneOptions}
      />

      <DynamicInputField
        label="Last Known Location"
        value={lastKnownLocation}
        onChangeText={onLastKnownLocationChange}
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
  );
};

export default AssetForm;
