import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import axios from 'axios';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';

// Responsive utilities
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const isLandscape = () => screenWidth > screenHeight;

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isContactUsVisible, setContactUsVisible] = useState(false);
  const [dialogBoxTitle, setDialogBoxTitle] = useState('Download User Manual');
  const [isLoading, setLoading] = useState(false);
  const [firstname, setFirstname] = useState();
  const [lastName, setLastName] = useState();
  const [hospitalId, setHospitalId] = useState();
  const [phoneNumber, setPhoneNumber] = useState();
  const [savedEmail, setSavedEmail] = useState();

  const tablet = isTablet();
  const landscape = isLandscape();

  useEffect(() => {
    const checkLogin = async () => {
      setFirstname(await AsyncStorage.getItem('firstName'));
      setLastName(await AsyncStorage.getItem('lastName'));
      setHospitalId(await AsyncStorage.getItem('hospitalId'));
      setPhoneNumber(await AsyncStorage.getItem('phoneNumber'));
      setSavedEmail(await AsyncStorage.getItem('savedEmail'));
    };
    checkLogin();
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const checkLogin = async () => {
        setFirstname(await AsyncStorage.getItem('firstName'));
        setLastName(await AsyncStorage.getItem('lastName'));
        setHospitalId(await AsyncStorage.getItem('hospitalId'));
        setPhoneNumber(await AsyncStorage.getItem('phoneNumber'));
        setSavedEmail(await AsyncStorage.getItem('savedEmail'));
      };
      checkLogin();
    }, []),
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'token',
        'savedEmail',
        'savedPassword',
        'rememberMe',
        'firstName',
        'lastName',
        'hospitalId',
        'phoneNumber',
      ]);
      navigation.replace('Login');
    } catch {
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    }
  };

  const handleUserManualDownload = () => setDialogVisible(true);

  const handleDownload = async () => {
    setLoading(true);
    const fileUrl =
      'http://34.130.164.111/apks/Chorus_Asset_Management_User_Manual.pdf';
    const fileName = 'Chorus_Asset_Management_User_Manual.pdf';
    const filePath =
      Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

    try {
      const result = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: filePath,
      }).promise;
      if (result.statusCode === 200) {
        setDialogVisible(false);
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Download Complete',
          text2: 'User Manual downloaded successfully!',
          visibilityTime: 3000,
          style: {
            backgroundColor: 'white',
            borderTopWidth: 4,
            borderTopColor: 'green',
            borderRadius: 8,
          },
          text1Style: {color: 'green', fontSize: 18, fontWeight: 'bold'},
          text2Style: {color: 'black', fontSize: 14},
        });
        await Share.open({
          url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
          title: 'Open File',
        });
      } else {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Download Failed',
          text2: 'An error occurred while downloading the user manual.',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      setDialogBoxTitle('Download error');
    } finally {
      setLoading(false);
    }
  };

  const handleContactUs = () => Linking.openURL('mailto:help@chorusview.com');

  const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#FFFFFF'},
    scrollContainer: {paddingBottom: tablet ? heightPercentageToDP(4) : 20},
    userInfoContainer: {
      alignItems: 'center',
      marginTop: tablet ? heightPercentageToDP(5) : 40,
      marginBottom: tablet ? heightPercentageToDP(3) : 20,
    },
    profileImage: {
      width: tablet ? 110 : 89,
      height: tablet ? 110 : 89,
      borderRadius: 60,
      marginTop: tablet ? heightPercentageToDP(4) : 50,
      marginBottom: tablet ? heightPercentageToDP(3) : 20,
    },
    userName: {
      fontSize: tablet ? 26 : 22,
      fontWeight: '700',
      color: '#242424',
    },
    userRole: {
      fontSize: tablet ? 16 : 14,
      color: '#868686',
      marginBottom: tablet ? heightPercentageToDP(1.5) : 10,
      marginTop: tablet ? heightPercentageToDP(1.5) : 10,
      fontWeight: '500',
    },
    userIdContainer: {
      backgroundColor: '#FDEFE9',
      paddingHorizontal: tablet ? 18 : 13,
      paddingVertical: tablet ? 10 : 8,
      borderRadius: 5,
    },
    userId: {
      color: '#EF652B',
      fontSize: tablet ? 16 : 14,
      fontWeight: '600',
    },
    optionsContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: '#F9F9F9',
      paddingTop: tablet ? heightPercentageToDP(3) : 25,
      paddingHorizontal: tablet ? widthPercentageToDP(5) : 20,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tablet ? heightPercentageToDP(2) : 10,
    },
    optionText: {
      fontSize: tablet ? 20 : 16,
      color: '#000',
      marginLeft: 10,
      fontWeight: '400',
    },
    tagIcon: {
      width: tablet ? 28 : 24,
      height: tablet ? 28 : 24,
      marginRight: 10,
    },
    mailIcon: {
      width: tablet ? 28 : 24,
      height: tablet ? 28 : 24,
      marginRight: 10,
    },
    downloadIcon: {
      transform: [{rotate: '90deg'}],
      width: tablet ? 28 : 24,
      height: tablet ? 28 : 24,
      marginRight: 10,
    },
    uploadIcon: {
      transform: [{rotate: '-90deg'}],
      width: tablet ? 28 : 24,
      height: tablet ? 28 : 24,
      marginRight: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialogBox: {
      width: tablet ? widthPercentageToDP(50) : 300,
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: tablet ? 30 : 20,
      alignItems: 'center',
    },
    dialogTitle: {
      fontSize: tablet ? 22 : 18,
      fontWeight: 'bold',
      marginBottom: tablet ? 15 : 10,
    },
    dialogContent: {
      fontSize: tablet ? 16 : 14,
      marginBottom: tablet ? 25 : 20,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    button: {
      flex: 1,
      padding: tablet ? 15 : 10,
      borderRadius: 5,
      alignItems: 'center',
      marginHorizontal: tablet ? 10 : 5,
    },
    cancelButton: {backgroundColor: '#808080'},
    downloadButton: {backgroundColor: '#EF652B'},
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: tablet ? 18 : 16,
    },
    close: {
      width: tablet ? 24 : 20,
      height: tablet ? 24 : 20,
    },
    closeContainer: {
      position: 'absolute',
      top: tablet ? 20 : 14,
      right: tablet ? 22 : 16,
      width: tablet ? 40 : 30,
      height: tablet ? 40 : 30,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    loaderContainer: {alignItems: 'center'},
    loadingText: {
      marginTop: 10,
      fontSize: tablet ? 16 : 14,
      color: '#555',
    },
  });

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.userInfoContainer}>
            <Image
              source={require('../../assets/images/blank.png')}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>
              {firstname?.[0]?.toUpperCase() + firstname?.slice(1)}{' '}
              {lastName?.[0]?.toUpperCase() + lastName?.slice(1)}
            </Text>
            <Text style={styles.userRole}>Chorus Asset Management</Text>
            <View style={styles.userIdContainer}>
              <Text style={styles.userId}>ID {hospitalId}</Text>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('UserProfileScreen')}>
              <Image
                source={require(`../../assets/images/profileUnHighlight.png`)}
                style={styles.tagIcon}
              />
              <Text style={styles.optionText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('ChangePasswordScreen')}>
              <Image
                source={require(`../../assets/images/lock.png`)}
                style={styles.tagIcon}
              />
              <Text style={styles.optionText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleUserManualDownload}>
              <Image
                source={require(`../../assets/images/logout.png`)}
                style={styles.downloadIcon}
              />
              <Text style={styles.optionText}>User Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleContactUs}>
              <Image
                source={require(`../../assets/images/mailIcon.png`)}
                style={styles.mailIcon}
              />
              <Text style={styles.optionText}>Contact Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('AddAssetScreen')}>
              <Image
                source={require(`../../assets/images/logout.png`)}
                style={styles.uploadIcon}
              />
              <Text style={styles.optionText}>Add New Asset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handleLogout}>
              <Image
                source={require(`../../assets/images/logout.png`)}
                style={styles.tagIcon}
              />
              <Text style={styles.optionText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Contact Us Modal */}
      <Modal transparent visible={isContactUsVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <TouchableOpacity
              style={styles.closeContainer}
              onPress={() => setContactUsVisible(false)}>
              <Image
                source={require('../../assets/images/close.png')}
                style={styles.close}
              />
            </TouchableOpacity>
            <Text style={styles.dialogTitle}>Reach out to us</Text>
            <Text style={styles.dialogContent}>
              “Need help? Contact us anytime at help@chorusview.com
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.downloadButton]}
                onPress={handleContactUs}>
                <Text style={styles.buttonText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Manual Modal */}
      <Modal transparent visible={isDialogVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>{dialogBoxTitle}</Text>
            {!isLoading ? (
              <>
                <Text style={styles.dialogContent}>
                  Do you want to download the user manual?
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setDialogVisible(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={isLoading}
                    style={[styles.button, styles.downloadButton]}
                    onPress={handleDownload}>
                    <Text style={styles.buttonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#EF652B" />
                <Text style={styles.loadingText}>Downloading...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ProfileScreen;
