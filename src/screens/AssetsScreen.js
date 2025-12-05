// Modified AssetScreen with responsive styling support for tablets and mobiles
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
  Dimensions,
} from 'react-native';
import axios from 'axios';
import {useFilter} from '../context/FilterContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagesEnum from '../shared/ImagesEnum';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useAssetListRefresh} from '../utils/useAssetRefresh';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function AssetsScreen() {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchBarWidth = useRef(new Animated.Value(0)).current;
  const {showFilter} = useFilter();
  const navigation = useNavigation();

  const fetchAssets = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        'https://api.matorg.com/v1/assets/assetsList',
        {location: '', description: ''},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      setAssets(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load assets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchAssets();
    }, []),
  );

  // Listen for asset refresh triggers
  useAssetListRefresh(fetchAssets);

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
      }).start(() => setIsSearchVisible(false));
    } else {
      setIsSearchVisible(true);
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
        navigation.navigate('AssetDetails', {
          asset: item,
          onAssetDeleted: (deletedAssetId, assetDescription) => {
            setAssets(prevAssets =>
              prevAssets.map(asset =>
                asset.description === assetDescription
                  ? {...asset, totalCount: Math.max(0, asset.totalCount - 1)}
                  : asset,
              ),
            );
            // Call the delete api and then refresh the assets list
            fetchAssets();
          },
        })
      }>
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
    outputRange: ['0%', isTablet ? '85%' : '75%'],
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#EF652B" />
      </SafeAreaView>
    );
  }

  const filteredAssets = searchTerm
    ? assets?.filter(asset =>
        asset?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      )
    : assets;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
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
          ) : (
            <Text style={styles.header}>Managed Assets</Text>
          )}
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleSearchBar}>
              {isSearchVisible ? (
                <Image
                  source={require('../../assets/images/crossIcon.png')}
                  style={styles.searchicon}
                />
              ) : (
                <Image
                  source={require('../../assets/images/searchIcon.png')}
                  style={styles.searchicon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredAssets}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContentContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const baseFontSize = isTablet ? 18 : 14;
const paddingSize = isTablet ? 24 : 16;
const scaleSize = size => (isTablet ? size * 1.3 : size);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: paddingSize,
    paddingHorizontal: paddingSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '600',
    color: '#0E0E0E',
    flex: 1,
    paddingLeft: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchicon: {
    marginLeft: isTablet ? 30 : 20,
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
    paddingLeft: 10,
    marginRight: 10,
  },
  searchInput: {
    fontSize: baseFontSize,
    color: '#000',
    flex: 1,
    height: isTablet ? 50 : 43,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: paddingSize,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: paddingSize,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: paddingSize,
    marginBottom: 8,
  },
  assetImage: {
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    marginRight: 16,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: baseFontSize,
    fontWeight: '600',
  },
  assetMonitored: {
    fontSize: baseFontSize - 1,
    color: '#0E0E0E',
    opacity: 0.5,
    fontWeight: '600',
  },
  assetMonitoredData: {
    fontSize: baseFontSize - 2,
    fontWeight: '600',
  },
  totalText: {
    flexDirection: 'row',
    marginTop: 8,
  },
  listContentContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    marginTop: scaleSize(15),
    padding: scaleSize(7),
  },
  searchNormalIcon: {
    opacity: 0.5,
    marginRight: 10,
  },
});
