import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableNativeFeedback,
  StatusBar,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagesEnum from '../shared/ImagesEnum';
import {useNavigation, useFocusEffect} from '@react-navigation/native'; // Import useNavigation hook
import {useDepartmentRefresh} from '../utils/useAssetRefresh';

const {width: screenWidth} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const scaleSize = size => (isTablet ? size * 1.3 : size);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(10),
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: isTablet ? scaleSize(24) : scaleSize(20),
    fontWeight: '600',
    color: '#0E0E0E',
    flex: 1,
    paddingLeft: scaleSize(10),
    marginLeft: scaleSize(10),
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchicon: {
    marginLeft: scaleSize(40),
    width: scaleSize(43),
    height: scaleSize(43),
  },
  filtericon: {
    marginLeft: scaleSize(5),
    marginRight: scaleSize(20),
    width: scaleSize(43),
    height: scaleSize(43),
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
    paddingLeft: scaleSize(10),
    marginRight: scaleSize(10),
  },
  searchInput: {
    fontSize: scaleSize(16),
    color: '#000',
    flex: 1,
    height: scaleSize(43),
  },
  closeIcon: {
    height: scaleSize(43),
    width: scaleSize(43),
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    marginTop: scaleSize(15),
    padding: scaleSize(7),
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleSize(16),
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginHorizontal: scaleSize(16),
    marginBottom: scaleSize(5),
  },
  assetImage: {
    width: scaleSize(50),
    height: scaleSize(50),
    marginRight: scaleSize(16),
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: scaleSize(15),
    fontWeight: '600',
  },
  assetMonitored: {
    fontSize: scaleSize(13),
    color: '#0E0E0E',
    opacity: 0.5,
    fontWeight: '600',
  },
  listContentContainer: {
    paddingBottom: scaleSize(80),
    backgroundColor: '#F9F9F9',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  icon: {
    width: scaleSize(44),
    height: scaleSize(44),
    marginLeft: scaleSize(10),
  },
  totalText: {
    flexDirection: 'row',
    marginTop: scaleSize(10),
  },
  searchNormalIcon: {
    opacity: 0.5,
    marginRight: scaleSize(10),
  },
  assetMonitoredData: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: '#202239',
  },
  backButton: {
    padding: scaleSize(10),
  },
});

export default function DepartmentListScreen({route}) {
  const {departmentDetails, departmentName, floor, zoneId} = route.params;
  const [assets, setAssets] = useState(departmentDetails || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchBarWidth = useRef(new Animated.Value(0)).current;
  const [searchTerm, setSearchTerm] = useState('');

  const navigation = useNavigation(); // Initialize useNavigation

  // Function to refresh department data
  const refreshDepartmentData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `https://api.matorg.com/v1/assets/floor/${floor}/${encodeURIComponent(
          departmentName,
        )}/${zoneId}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      // Update local state instead of route params
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to refresh department data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [floor, departmentName, zoneId]);

  // Listen for department refresh triggers
  useDepartmentRefresh(refreshDepartmentData);

  // Refresh when returning from details screen
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        // Check if we're returning from DepartmentAssetDetailsScreen
        const routes = navigation.getState()?.routes;
        const previousRoute = routes[routes.length - 2];

        if (previousRoute?.name === 'DepartmentAssetDetailsScreen') {
          // Refresh department data when returning from details
          refreshDepartmentData();
        }
      });

      return unsubscribe;
    }, [navigation, refreshDepartmentData]),
  );

  // useEffect(() => {
  //   console.log("tgfrds");
  //   fetchAssets();
  // }, []);

  // const fetchAssets = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token"); // Retrieve the token from storage

  //     const response = await axios.post(
  //       "http://localhost:8000/v1/assets/assetsList",
  //       {
  //         location: "",
  //         description: "",
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
  //         },
  //       }
  //     );
  //     console.log(response?.data);

  //     setAssets(response.data);
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to load assets.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSearch = text => {
    setSearchTerm(text);
  };

  const toggleSearchBar = () => {
    setSearchTerm('');
    if (isSearchVisible) {
      Animated.timing(searchBarWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsSearchVisible(false)); // Hide only after animation
    } else {
      setIsSearchVisible(true); // Show before animation
      Animated.timing(searchBarWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };
  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.assetItem}
      onPress={() =>
        navigation.navigate('DepartmentAssetDetailsScreen', {
          asset: item,
          departmentName,
          floor,
          zoneId,
          onAssetDeleted: (deletedAssetId, assetDescription) => {
            // Update local state when asset is deleted
            setAssets(prevAssets =>
              prevAssets.map(asset =>
                asset.description === assetDescription
                  ? {...asset, totalCount: Math.max(0, asset.totalCount - 1)}
                  : asset,
              ),
            );
          },
        })
      } // Pass the asset data to the details screen
    >
      {/* <Image source={{ uri: item.image }} style={styles.assetImage} /> */}
      <Image
        source={ImagesEnum?.[item.description]}
        style={styles.assetImage}
      />
      <View style={styles.assetInfo}>
        <Text style={styles.assetName}>{item.description}</Text>
        <View style={styles.totalText}>
          <Text style={styles.assetMonitored}>Total: </Text>
          <Text style={styles.assetMonitoredData}>{item.totalCount}</Text>
          <Text style={styles.assetMonitored}>&nbsp;&nbsp;|&nbsp;&nbsp;</Text>
          <Text style={styles.assetMonitored}>Monitoring: </Text>
          <Text style={styles.assetMonitoredData}>{item.monitoringCount}</Text>
          <Text style={styles.assetMonitored}>&nbsp;&nbsp;|&nbsp;&nbsp;</Text>
          <Text style={styles.assetMonitoredData}>
            {item.monitoringPercentage}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const searchBarInterpolation = searchBarWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '75%'], // Adjust the final width as needed
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#EF652B" />
      </SafeAreaView>
    );
  }
  const ButtonComponent =
    Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

  const filteredAssets = searchTerm
    ? assets?.filter(asset =>
        asset?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      )
    : assets;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <ButtonComponent onPress={() => navigation.goBack()} useForeground>
            <View style={styles.backButton}>
              <Image source={require('../../assets/images/backArrow.png')} />
            </View>
          </ButtonComponent>
          {isSearchVisible ? (
            <Animated.View
              style={[
                styles.searchBarContainer,
                {width: searchBarInterpolation},
              ]}>
              <Image
                source={require('../../assets/images/search-normal.png')}
                style={styles.searchNormalIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#888"
                autoFocus
                onChangeText={handleSearch}
                selectionColor="#EF652B"
              />
            </Animated.View>
          ) : null}
          {!isSearchVisible && (
            <Text style={styles.header}>{departmentName}</Text>
          )}
          <View style={styles.iconContainer}>
            {isSearchVisible ? (
              <TouchableOpacity
                onPress={toggleSearchBar}
                style={styles.closeIcon}>
                <Image source={require('../../assets/images/crossIcon.png')} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={toggleSearchBar}>
                <Image
                  source={require('../../assets/images/searchIcon.png')}
                  style={styles.searchicon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contentContainer}>
          <FlatList
            data={filteredAssets}
            renderItem={renderItem} // Pass the renderItem function here
            keyExtractor={(item, i) => i}
            contentContainerStyle={styles.listContentContainer}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
