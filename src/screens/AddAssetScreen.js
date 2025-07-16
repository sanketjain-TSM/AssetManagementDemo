import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
  Keyboard,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {TouchableWithoutFeedback} from 'react-native';

// Import custom components
import AssetFormHeader from '../components/AssetFormHeader';
import AssetForm from '../components/AssetForm';
import AssetDescriptionModal from '../components/AssetDescriptionModal';

// Import custom hooks
import useAssetForm from '../utils/useAssetForm';
import useAssetValidation from '../utils/useAssetValidation';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

export default function AddAssetScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Check if in edit mode and get asset data
  const isEditMode = route.params?.mode === 'edit';
  const editAssetId = route.params?.assetId;
  const assetData = route.params?.assetData;

  const tablet = isTablet();

  // Use custom hooks
  const {
    deviceId,
    assetId,
    assetDescription,
    zone,
    lastKnownLocation,
    loading,
    initialLoading,
    assetDescriptionOptions,
    zoneOptions,
    modalVisible,
    modalMode,
    modalInitialValue,
    modalLoading,
    descriptionsLoading,
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
  } = useAssetForm(isEditMode, editAssetId, assetData);

  const {deviceIdValid, deviceIdMessage, getDeviceIdValidationState} =
    useAssetValidation(deviceId);

  const handleSaveAssetWithValidation = async () => {
    const success = await handleSaveAsset(deviceIdValid);
    if (success) {
      navigation.goBack();
    }
  };

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: '#fff',
      paddingTop: Platform.OS === 'ios' ? 40 : 0,
      paddingHorizontal: tablet ? widthPercentageToDP(5) : 20,
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
        <AssetFormHeader
          title={isEditMode ? 'Edit Asset' : 'Add Asset'}
          onBackPress={() => navigation.goBack()}
        />
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
          <AssetFormHeader
            title={isEditMode ? 'Edit Asset' : 'Add Asset'}
            onBackPress={() => navigation.goBack()}
          />

          <AssetForm
            deviceId={deviceId}
            assetId={assetId}
            assetDescription={assetDescription}
            zone={zone}
            lastKnownLocation={lastKnownLocation}
            loading={loading}
            assetDescriptionOptions={assetDescriptionOptions}
            zoneOptions={zoneOptions}
            deviceIdValidationState={getDeviceIdValidationState()}
            deviceIdMessage={deviceIdMessage}
            onDeviceIdChange={handleDeviceIdChange}
            onAssetIdChange={setAssetId}
            onAssetDescriptionChange={setAssetDescription}
            onZoneChange={setZone}
            onLastKnownLocationChange={setLastKnownLocation}
            onSaveAsset={handleSaveAssetWithValidation}
            onAddNewDescription={handleAddNew}
            onEditDescription={handleEdit}
            descriptionsLoading={descriptionsLoading}
            isEditMode={isEditMode}
          />
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
