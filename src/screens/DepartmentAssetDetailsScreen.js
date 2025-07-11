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
    zIndex: 1,
    backgroundColor: '#FFFFFF',
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
    justifyContent: 'space-between',
    marginBottom: 5,
    backgroundColor: '#F9F9F9',
    paddingTop: 5,
  },
  assetDetailValue: {
    color: '#0E0E0E',
    fontSize: scaleSize(14),
    fontWeight: '600',
    fontFamily: 'Roboto',
    marginLeft: scaleSize(10),
    marginTop: scaleSize(4),
  },
  assetInfoContainer: {
    borderRadius: 5,
    paddingBottom: 5,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingLeft: scaleSize(10),
    paddingRight: scaleSize(10),
    marginBottom: scaleSize(5),
  },
  infoLabel: {
    fontSize: scaleSize(14),
    opacity: 0.5,
    marginVertical: scaleSize(4),
    width: isTablet ? 180 : 140,
  },
  infoValue: {
    fontSize: scaleSize(14),
    color: '#0E0E0E',
    fontWeight: '600',
    marginVertical: scaleSize(3),
    marginLeft: scaleSize(10),
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
    width: scaleSize(9),
    height: scaleSize(8),
    marginLeft: scaleSize(70),
    marginTop: scaleSize(8),
  },
});

const DepartmentAssetDetailsScreen = ({route}) => {
  const {devices} = useDevicesContext();

  const {asset, floor, departmentName, zoneId} = route?.params;
  const [collapsedStates, setCollapsedStates] = useState({});
  const [assetsList, setAssetsList] = useState([]);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // useEffect(() => setError(""), [started]);

  const navigation = useNavigation();
  useEffect(() => {
    fetchAssets();
  }, []);

  // console.log(role, "role");

  // useEffect(() => {
  //   if (devices.length === 0) return;

  //   // Create a Map for fast lookups
  //   // const deviceMap = new Map(
  //   //   devices.map((device) => [device.id, device.rssi])
  //   // );

  //   const deviceMap = syncDevicesWithAssets(devices);

  //   // Update the assets list with the new RSSI values
  //   setAssetsList((prevAssetsList) =>
  //     prevAssetsList.map((asset) => {
  //       if (deviceMap.has(asset.deviceId)) {
  //         return {
  //           ...asset,
  //           rssi: deviceMap.get(asset.deviceId),
  //         };
  //       }
  //       return asset;
  //     })
  //   );
  // }, [JSON.stringify(devices)]);

  const fetchAssets = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await axios.get(
        `http://34.57.92.8:8000/v1/assets/floor/${floor}/${encodeURIComponent(
          departmentName,
        )}/${zoneId}/${encodeURIComponent(asset?.description)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const newAssets = response?.data?.assets;
      if (newAssets.length < limit) {
        setHasMore(false);
      }

      setAssetsList(prevList => [...prevList, ...newAssets]);
    } catch (error) {
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

  const renderAssetItem = ({item, index}) => {
    const {formattedDate, formattedTime} = formatDateTime(item.lastSeenTime);

    return (
      <View key={index} style={styles.assetContainer}>
        <View style={styles.assetDetailsContainer}>
          <TouchableOpacity onPress={() => toggleCollapse(index)}>
            <View style={styles.assetInfo}>
              <Text style={styles.infoLabel}>Asset ID</Text>
              <Text style={styles.assetDetailValue}>: {item.tagNumber}</Text>
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
            </View>
          </TouchableOpacity>
          <Collapsible collapsed={!collapsedStates[index]}>
            <View style={styles.assetInfoContainer}>
              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Chorus ID</Text>
                <Text style={styles.infoValue}>: {item.deviceId?.trim()}</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Model Number</Text>
                <Text style={styles.infoValue}>: {item.modelNumber}</Text>
              </View>

              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Manufacturer</Text>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.infoValue}>
                  : {item.manufacturer}
                </Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.infoLabel}>Zone</Text>
                <Text style={styles.infoValue}>: {item.zoneId}</Text>
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
            {/* {<FourBarSignalMeter rssi={item.deviceId?.trim()} />} */}
            {/* {<SixBarSignalMeter rssi={item.deviceId?.trim()} />} */}
            {<SixBarIndicatorSignalmeter rssi={item.deviceId?.trim()} />}
            {/* {<HzSignalStrengthMeter rssi={item.deviceId?.trim()} />} */}
            {/* {<SignalStrengthMeter rssi={item.deviceId?.trim()} />} */}
            {/* {<ProximityProgressBar deviceId={item.deviceId?.trim()} />} */}
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

          {/* <View style={styles.locationRow}>
            <Image source={require("../../assets/images/Unknown.png")} style={{ height: 22, width: 38, marginLeft: 10 }} />
            <Text>Rssi: {item?.rssi}</Text>
          </View> */}
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
          <Text style={styles.modelValue}>{asset.totalCount}</Text>
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
    </View>
  );
};

export default DepartmentAssetDetailsScreen;
