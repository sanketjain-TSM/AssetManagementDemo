import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  TouchableNativeFeedback,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import ImagesEnum from '../shared/ImagesEnum';
import {formatDateTime} from '../utils/formatDateTime';
import {useDevicesContext} from '../context/DeviceContext';
import {SignalStrengthMeter} from '../components/SignalStrengthMeter';
import GroundTruth from '../components/GroundTruth';
import {syncDevicesWithAssets} from '../utils/syncDevicesWithAssets';
import {ProximityProgressBar} from '../components/ProximityProgressBar';
import {HzSignalStrengthMeter} from '../components/HzSignalStrengthMeter';
import {FourBarSignalMeter} from '../components/FourBarSignalMeter';
import {SixBarSignalMeter} from '../components/SixBarSignalMeter';
import {SixBarIndicatorSignalmeter} from '../components/SixBarIndicatorSignalmeter';

const {width: screenWidth} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const scaleSize = size => (isTablet ? size * 1.3 : size);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  listContainer: {
    padding: scaleSize(16),
    paddingTop: scaleSize(6),
  },
  headerContainer: {
    padding: scaleSize(10),
    marginBottom: scaleSize(10),
    alignItems: 'center',
    paddingVertical: scaleSize(70),
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  backArrorwContainer: {
    width: '100%',
    paddingLeft: scaleSize(10),
  },
  backArrow: {
    width: isTablet ? 60 : 44,
    height: isTablet ? 60 : 44,
    resizeMode: 'contain',
  },
  assetImage: {
    width: isTablet ? 100 : 60,
    height: isTablet ? 100 : 60,
    marginTop: scaleSize(10),
    alignSelf: 'center',
    marginBottom: scaleSize(16),
  },
  assetName: {
    fontSize: scaleSize(22),
    color: '#242424',
    fontFamily: 'Roboto',
    fontWeight: '700',
    marginTop: scaleSize(10),
  },
  assetContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginBottom: scaleSize(10),
    padding: scaleSize(16),
  },
  assetDetailsContainer: {
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 5,
    backgroundColor: '#F9F9F9',
    paddingTop: 5,
    width: '100%',
  },
  assetDetailsTouchable: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
  },
  assetDetailValue: {
    color: '#0E0E0E',
    fontSize: scaleSize(14),
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  assetInfoContainer: {
    borderRadius: 5,
    paddingBottom: 5,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    paddingLeft: scaleSize(10),
    paddingRight: scaleSize(10),
    marginBottom: scaleSize(5),
  },
  infoLabel: {
    fontSize: scaleSize(14),
    opacity: 0.5,
    marginVertical: scaleSize(4),
  },
  infoValue: {
    fontSize: scaleSize(14),
    color: '#0E0E0E',
    fontWeight: '600',
    marginVertical: scaleSize(3),
    marginLeft: isTablet ? scaleSize(10) : scaleSize(1),
    width: isTablet ? 180 : 130,
  },
  modelRow: {
    backgroundColor: '#FFFFFF',
    height: scaleSize(35),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 0,
  },
  modelLabel: {
    fontSize: scaleSize(14),
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: '#0E0E0E',
    opacity: 0.5,
  },
  modelValue: {
    fontSize: scaleSize(14),
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: '#0E0E0E',
  },
  lastKnownLocation: {
    backgroundColor: '#F2F9FF',
    padding: scaleSize(10),
    height: scaleSize(175),
    justifyContent: 'center',
    borderRadius: 5,
    width: '100%',
    gap: scaleSize(8),
  },
  locationTitle: {
    fontSize: scaleSize(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: '#202239',
    opacity: 0.5,
  },
  locationText: {
    fontSize: scaleSize(14),
    fontFamily: 'Roboto',
    color: '#202239',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scaleSize(1.5),
  },
  locationInfo: {
    flexDirection: 'row',
    gap: scaleSize(20),
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(2),
  },
  icon: {
    width: scaleSize(18),
    height: scaleSize(18),
    marginRight: scaleSize(4),
  },
  locationRow: {
    fontSize: scaleSize(14),
    color: '#202239',
    fontWeight: '400',
  },
  rssiContainer: {
    width: '50%',
    justifyContent: 'center',
  },
  arrowIcon: {
    height: scaleSize(8),
  },
  menuIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(10),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: scaleSize(20),
    width: scaleSize(280),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: scaleSize(20),
    color: '#242424',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(15),
    paddingHorizontal: scaleSize(10),
    borderRadius: 8,
    marginBottom: scaleSize(10),
  },
  editOption: {
    backgroundColor: '#E3F2FD',
  },
  deleteOption: {
    backgroundColor: '#FFEBEE',
  },
  modalOptionText: {
    fontSize: scaleSize(16),
    fontWeight: '500',
    marginLeft: scaleSize(10),
  },
  editText: {
    color: '#1976D2',
  },
  deleteText: {
    color: '#D32F2F',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: scaleSize(12),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: scaleSize(10),
  },
  cancelButtonText: {
    fontSize: scaleSize(16),
    color: '#666',
    fontWeight: '500',
  },
  modalIcon: {
    fontSize: scaleSize(20),
  },
});

const DepartmentAssetDetailsScreen = ({route}) => {
  const {devices} = useDevicesContext();

  const {asset, floor, departmentName, zoneId, onAssetDeleted} = route?.params;
  const [collapsedStates, setCollapsedStates] = useState({});
  const [assetsList, setAssetsList] = useState([]);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentTotalCount, setCurrentTotalCount] = useState(
    asset?.totalCount || 0,
  );

  // Modal state
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(
        `http://api.matorg.com:8000/v1/assets/floor/${floor}/${encodeURIComponent(
          departmentName,
        )}/${zoneId}/${encodeURIComponent(asset?.description)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const newAssets = response?.data?.assets;
      console.log(newAssets, 'Fetched assets');
      if (newAssets.length < limit) {
        setHasMore(false);
      }

      setAssetsList(prevList => [...prevList, ...newAssets]);
    } catch (error) {
      console.error('Fetch assets error:', error);
      Alert.alert('Error', 'Failed to load assets.');
    } finally {
      setLoading(false);
    }
  };

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

  const toggleCollapse = index => {
    setCollapsedStates(prevState => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleMenuPress = item => {
    setSelectedAsset(item);
    setShowMenuModal(true);
  };

  const handleEditAsset = () => {
    setShowMenuModal(false);
    if (selectedAsset) {
      // Navigate to AddAsset screen in edit mode
      navigation.navigate('AddAssetScreen', {
        mode: 'edit',
        assetId: selectedAsset.id,
        assetData: selectedAsset,
      });
    }
  };

  const handleDeleteAsset = () => {
    setShowMenuModal(false);
    if (selectedAsset) {
      Alert.alert(
        'Delete Asset',
        `Are you sure you want to delete asset ${selectedAsset.tagNumber}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteAsset(selectedAsset),
          },
        ],
      );
    }
  };

  const deleteAsset = async assetToDelete => {
    console.log('Deleting asset:', assetToDelete);
    try {
      const token = await AsyncStorage.getItem('token');

      // Replace with your actual delete API endpoint
      await axios.delete(
        `https://api.matorg.com/v1/assets/delete-asset/${assetToDelete?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Remove the asset from the local list
      setAssetsList(prevList =>
        prevList.filter(item => item.id !== assetToDelete.id),
      );

      // Update local count
      setCurrentTotalCount(prevCount => Math.max(0, prevCount - 1));

      // Call the callback to update parent screen counts
      if (onAssetDeleted) {
        onAssetDeleted(assetToDelete.id, asset.description);
      }

      Alert.alert('Success', 'Asset deleted successfully.');
    } catch (error) {
      console.error('Delete asset error:', error);
      Alert.alert('Error', 'Failed to delete asset. Please try again.');
    }
  };

  const renderAssetItem = ({item, index}) => {
    const {formattedDate, formattedTime} = formatDateTime(item.lastSeenTime);

    return (
      <View key={index} style={styles.assetContainer}>
        <View style={styles.assetDetailsContainer}>
          <TouchableOpacity
            onPress={() => toggleCollapse(index)}
            style={styles.assetDetailsTouchable}>
            <View style={styles.assetInfo}>
              <Text style={styles.infoLabel}>Asset ID : </Text>
              <Text style={styles.assetDetailValue}>{item.tagNumber}</Text>
            </View>
            <View style={styles.iconsContainer}>
              <Image
                source={require('../../assets/images/downarrow.png')}
                style={[
                  styles.arrowIcon,
                  {
                    transform: [
                      {rotate: collapsedStates[index] ? '180deg' : '0deg'},
                    ],
                  },
                ]}
              />
              <TouchableOpacity onPress={() => handleMenuPress(item)}>
                <Image
                  source={require('../../assets/images/menu-vertical.png')}
                  style={styles.menuIcon}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <Collapsible collapsed={!collapsedStates[index]}>
            <View style={styles.assetInfoContainer}>
              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Chorus ID : </Text>
                <Text style={styles.infoValue}>{item.deviceId?.trim()}</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Model Number : </Text>
                <Text style={styles.infoValue}>{item.modelNumber}</Text>
              </View>

              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Manufacturer : </Text>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.infoValue}>
                  {item.manufacturer}
                </Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Zone : </Text>
                <Text style={styles.infoValue}>{item.zoneId}</Text>
              </View>
            </View>
          </Collapsible>
        </View>
        <View style={styles.lastKnownLocation}>
          <Text style={styles.locationTitle}>LAST KNOWN LOCATION</Text>
          <View style={styles.locationContainer}>
            <Image
              source={require('../../assets/images/location.png')}
              style={styles.icon}
            />
            <Text style={styles.locationText}>
              {ordinalSuffixOf(item?.floor)}
              {item?.department?.toLowerCase() == 'unknown'
                ? ''
                : `, ${item?.department}`}
            </Text>
          </View>
          <View style={styles.rssiContainer}>
            {<SixBarIndicatorSignalmeter rssi={item.deviceId?.trim()} />}
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.dateTimeContainer}>
              <Image
                source={require('../../assets/images/calendar.png')}
                style={styles.icon}
              />
              <Text style={styles.locationRow}>{formattedDate}</Text>
            </View>
            <View style={styles.dateTimeContainer}>
              <Image
                source={require('../../assets/images/clock.png')}
                style={styles.icon}
              />
              <Text style={styles.locationRow}>{formattedTime}</Text>
            </View>
          </View>

          <View>
            <GroundTruth item={item} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.backArrorwContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/images/backArrow.png')}
              style={styles.backArrow}
            />
          </TouchableOpacity>
        </View>
        <Image
          source={ImagesEnum?.[asset.description]}
          style={styles.assetImage}
        />
        <Text style={styles.assetName}>{asset.description}</Text>
        <View style={styles.modelRow}>
          <View>
            <Text style={styles.modelLabel}>Total Assets :</Text>
          </View>
          <Text style={styles.modelValue}>{currentTotalCount}</Text>
        </View>
      </View>

      <FlatList
        style={styles.listContainer}
        data={assetsList}
        renderItem={renderAssetItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        onEndReached={
          hasMore ? () => setSkip(prevSkip => prevSkip + limit) : null
        }
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" color="#EF652B" /> : null
        }
      />

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}>
          <View style={styles.modalContainer}>
            {/* <Text style={styles.modalTitle}>Asset Options</Text> */}

            <TouchableOpacity
              style={[styles.modalOption, styles.editOption]}
              onPress={handleEditAsset}>
              <Icon
                name="create-outline"
                style={[styles.modalIcon, styles.editText]}
              />
              <Text style={[styles.modalOptionText, styles.editText]}>
                Edit Asset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.deleteOption]}
              onPress={handleDeleteAsset}>
              <Icon
                name="trash-outline"
                style={[styles.modalIcon, styles.deleteText]}
              />
              <Text style={[styles.modalOptionText, styles.deleteText]}>
                Delete Asset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMenuModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default DepartmentAssetDetailsScreen;
