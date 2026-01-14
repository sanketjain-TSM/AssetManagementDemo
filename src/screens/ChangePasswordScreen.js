import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;
const tablet = isTablet();

const ChangePasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleChangePassword = async () => {
    setLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }

      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        'https://api.matorg.com/v1/user/changePassword',
        {newPassword: newPassword},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      Alert.alert('Success', 'Password changed successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(), // Navigate back on success
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'There was an issue changing your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/images/backArrow.png')}
              style={styles.backArrow}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Change Password</Text>
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Create New</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Create Password"
            value={newPassword}
            onChangeText={setNewPassword}
            selectionColor="#EF652B"
          />
          <Text style={styles.label}>Confirm</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            selectionColor="#EF652B"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: tablet ? widthPercentageToDP(5) : 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tablet ? heightPercentageToDP(4) : 20,
  },
  headerText: {
    fontSize: tablet ? 26 : 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
  },
  backArrow: {
    width: tablet ? 44 : 36,
    height: tablet ? 44 : 36,
    marginRight: tablet ? 15 : 10,
  },
  formContainer: {
    width: '100%',
    marginTop: tablet ? heightPercentageToDP(2) : 20,
  },
  label: {
    fontSize: tablet ? 18 : 16,
    color: '#0E0E0E',
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '400',
  },
  input: {
    height: tablet ? 60 : 50,
    fontSize: tablet ? 17 : 15,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    borderRadius: 5,
    fontWeight: '400',
    color: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginBottom: tablet ? 25 : 20,
  },
  button: {
    marginTop: tablet ? heightPercentageToDP(4) : 40,
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
});

export default ChangePasswordScreen;
