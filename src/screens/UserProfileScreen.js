import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import {RolesMap} from '../shared/rolesMap';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savedEmail, setSavedEmail] = useState();
  const [userRole, setUserRole] = useState();
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState('brookdale');
  const [open, setOpen] = useState(false);
  const [orgList, setOrgList] = useState([]);
  const [role, setRole] = useState('');
  const tablet = isTablet();

  useEffect(() => {
    const checkLogin = async () => {
      setFirstName(await AsyncStorage.getItem('firstName'));
      setLastName(await AsyncStorage.getItem('lastName'));
      setHospitalId(await AsyncStorage.getItem('hospitalId'));
      setPhoneNumber(await AsyncStorage.getItem('phoneNumber'));
      setSavedEmail(await AsyncStorage.getItem('savedEmail'));
      setUserRole(await AsyncStorage.getItem('role'));
      setOrganizationId(
        (await AsyncStorage.getItem('organization')) || 'brookdale',
      );
    };
    checkLogin();
  }, []);

  useEffect(() => {
    fetchOrgList();
  }, []);
  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const role = await AsyncStorage.getItem('role');
      if (isMounted) setRole(role);
    };
    fetchRole();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchOrgList = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('https://api.matorg.com/v1/user/orgs', {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (response.status === 200) {
        setOrgList(
          Object.keys(response.data).map(org => ({
            label: org,
            value: response.data[org],
          })),
        );
      }
    } catch (error) {}
  };

  const handleProfileChange = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.patch(
        'https://api.matorg.com/v1/auth/user/update',
        {
          firstName,
          lastName,
          hospitalId,
          phoneNumber,
          organizationId,
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      if (response.status === 200) {
        Alert.alert('Success', 'User Details changed successfully.', [
          {
            text: 'OK',
            onPress: () => {
              setIsEditable(false);
              navigation.navigate('Profile');
            },
          },
        ]);
        const updated = response.data.user;
        await AsyncStorage.multiSet([
          ['firstName', updated.firstName],
          ['lastName', updated.lastName],
          ['hospitalId', updated.hospitalId],
          ['phoneNumber', updated.phoneNumber || ''],
          ['organization', updated.organizationId],
          ['token', response.data.accessToken],
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      backgroundColor: '#fff',
      paddingTop: Platform.OS === 'ios' ? 40 : 20,
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
      color: '#0E0E0E',
    },
    backButton: {marginLeft: tablet ? 20 : 15},
    backArrow: {
      width: tablet ? 44 : 36,
      height: tablet ? 44 : 36,
      marginRight: tablet ? 15 : 10,
      marginLeft: -10,
    },
    profileContainer: {
      paddingVertical: tablet ? heightPercentageToDP(3) : 10,
      alignItems: 'center',
    },
    profileImage: {
      width: tablet ? 140 : 120,
      height: tablet ? 140 : 120,
      borderRadius: 70,
      marginBottom: tablet ? 25 : 20,
      opacity: 0.85,
    },
    inputContainer: {width: '100%', marginBottom: tablet ? 25 : 20},
    inputContainerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: tablet ? 25 : 20,
    },
    halfInputContainer: {flex: 1, paddingRight: 5},
    label: {
      fontSize: tablet ? 18 : 16,
      fontWeight: '400',
      marginBottom: 8,
    },
    input: {
      height: tablet ? 60 : 50,
      padding: 12,
      borderRadius: 5,
      fontSize: tablet ? 17 : 15,
      fontWeight: '400',
      color: '#0E0E0E',
      opacity: 0.5,
      borderWidth: 1,
      borderColor: '#D9D9D9',
    },
    enabledInput: {
      height: tablet ? 60 : 50,
      padding: 12,
      borderRadius: 5,
      fontSize: tablet ? 17 : 15,
      fontWeight: '400',
      color: '#0E0E0E',
      borderWidth: 1,
      borderColor: '#D9D9D9',
    },
    inputHalf: {
      height: tablet ? 60 : 50,
      padding: 12,
      borderRadius: 5,
      fontSize: tablet ? 17 : 15,
      fontWeight: '400',
      color: '#0E0E0E',
      opacity: 0.5,
      borderWidth: 1,
      borderColor: '#D9D9D9',
    },
    enabledInputHalf: {
      height: tablet ? 60 : 50,
      padding: 12,
      borderRadius: 5,
      fontSize: tablet ? 17 : 15,
      fontWeight: '400',
      color: '#0E0E0E',
      borderWidth: 1,
      borderColor: '#D9D9D9',
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
    },
    buttonText: {
      color: '#FFF',
      fontSize: tablet ? 20 : 18,
      fontWeight: '400',
    },
    dropdown: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#D9D9D9',
      borderRadius: 5,
      height: tablet ? 60 : 50,
    },
    dropdownDisabled: {
      backgroundColor: '#F9F9F9',
      borderWidth: 1,
      borderColor: '#D9D9D9',
      borderRadius: 5,
      opacity: 0.5,
      height: tablet ? 60 : 50,
    },
  });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      enableOnAndroid
      extraScrollHeight={20}
      extraHeight={100}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.backButton}>
          <Image
            source={require('../../assets/images/backArrow.png')}
            style={styles.backArrow}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>My Profile</Text>
      </View>
      <View style={styles.profileContainer}>
        <Image
          source={require('../../assets/images/blank.png')}
          style={styles.profileImage}
        />
        <View style={styles.inputContainerRow}>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={!isEditable ? styles.inputHalf : styles.enabledInputHalf}
              value={
                firstName ? firstName[0].toUpperCase() + firstName.slice(1) : ''
              }
              editable={isEditable}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={!isEditable ? styles.inputHalf : styles.enabledInputHalf}
              value={
                lastName ? lastName[0].toUpperCase() + lastName.slice(1) : ''
              }
              editable={isEditable}
              onChangeText={setLastName}
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={savedEmail} editable={false} />
        </View>
        <View style={styles.inputContainerRow}>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>ID</Text>
            <TextInput
              style={!isEditable ? styles.input : styles.enabledInput}
              value={hospitalId}
              editable={isEditable}
              onChangeText={setHospitalId}
            />
          </View>
          <View style={styles.halfInputContainer}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              style={styles.input}
              value={RolesMap[userRole]}
              editable={false}
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={!isEditable ? styles.input : styles.enabledInput}
            value={phoneNumber}
            editable={isEditable}
            placeholder="XXX-XXX-XXXX"
            onChangeText={setPhoneNumber}
          />
        </View>
        {role === 'superAdmin' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Organization</Text>
            <View style={{marginBottom: open ? 100 : 20, zIndex: 2000}}>
              <DropDownPicker
                open={open}
                value={organizationId}
                items={orgList}
                setOpen={setOpen}
                setValue={setOrganizationId}
                setItems={setOrgList}
                disabled={!isEditable}
                containerStyle={{minHeight: 50}}
                style={!isEditable ? styles.dropdownDisabled : styles.dropdown}
                zIndex={3000}
                zIndexInverse={1000}
              />
            </View>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, loading && {backgroundColor: '#CCC'}]}
          onPress={() =>
            !isEditable ? setIsEditable(true) : handleProfileChange()
          }
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              {!isEditable ? 'Edit Profile' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
