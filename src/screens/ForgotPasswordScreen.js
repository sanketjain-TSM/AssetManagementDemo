import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;

const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;

const isTablet = () => {
  const aspectRatio = screenHeight / screenWidth;
  return screenWidth >= 768 && aspectRatio < 1.6;
};

const isLandscape = () => screenWidth > screenHeight;

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const navigation = useNavigation();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) =>
      setDimensions(window),
    );
    return () => subscription?.remove();
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.matorg.com/v1/auth/forgotPassword',
        {email: email.toLowerCase()},
      );
      if (response.status === 200) {
        const {hashedUser} = response?.data;
        navigation.navigate('OtpScreen', {hashedUser, email});
      } else {
        Alert.alert('Error', 'Failed to generate OTP. Please try again.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tablet = isTablet();
  const landscape = isLandscape();

  const styles = StyleSheet.create({
    container: {
      padding: tablet ? widthPercentageToDP(5) : 20,
      paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
      backgroundColor: '#FFF',
      justifyContent: tablet && landscape ? 'flex-start' : 'center',
      paddingBottom: tablet ? heightPercentageToDP(8) : 75,
      minHeight: tablet && landscape ? '100%' : '100%',
    },
    contentWrapper: {
      maxWidth: tablet
        ? landscape
          ? widthPercentageToDP(50)
          : widthPercentageToDP(70)
        : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    logoContainer: {
      flexDirection: 'row',
      marginBottom: tablet ? heightPercentageToDP(20) : 20,
      justifyContent: 'flex-start',
    },
    logo: {
      marginBottom: tablet
        ? landscape
          ? heightPercentageToDP(15)
          : heightPercentageToDP(8)
        : 210,
      marginTop: tablet ? heightPercentageToDP(5) : 50,
      transform: tablet ? [{scale: landscape ? 1.2 : 1.5}] : [{scale: 1}],
    },
    title: {
      fontSize: tablet ? (landscape ? 36 : 48) : 42,
      fontWeight: '600',
      textAlign: 'left',
    },
    subtitle1: {
      fontSize: tablet ? 18 : 15,
      textAlign: 'left',
      marginBottom: 5,
      fontFamily: 'Roboto',
      opacity: 0.5,
      marginTop: tablet ? heightPercentageToDP(2) : heightPercentageToDP(1),
      marginLeft: tablet ? 0 : 2,
      fontWeight: 'regular',
      color: '#000000',
    },
    subtitle2: {
      fontSize: tablet ? 18 : 15,
      textAlign: 'left',
      marginBottom: tablet ? heightPercentageToDP(4) : 30,
      fontFamily: 'Roboto',
      opacity: 0.5,
      marginLeft: tablet ? 0 : 3,
      color: '#000000',
    },
    inputContainer: {
      marginBottom: tablet ? heightPercentageToDP(2) : 0,
    },
    email: {
      height: tablet ? heightPercentageToDP(5) : 50,
      borderRadius: tablet ? 8 : 5,
      paddingHorizontal: 20,
      marginBottom: tablet ? heightPercentageToDP(2) : 40,
      backgroundColor: '#F9F9F9',
      fontSize: tablet ? 18 : 16,
    },
    eyeIcon: {
      position: 'absolute',
      right: 10,
      top: tablet ? heightPercentageToDP(1.5) : 15,
      width: tablet ? 26 : 22,
      height: tablet ? 26 : 22,
    },
    passwordContainer: {
      position: 'relative',
      justifyContent: 'center',
      marginBottom: -5,
    },
    signInButton: {
      height: tablet ? heightPercentageToDP(5) : 50,
      backgroundColor: '#EF652B',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: tablet ? 8 : 5,
      marginBottom: tablet ? heightPercentageToDP(2) : 10,
      marginTop: tablet ? heightPercentageToDP(2) : 0,
    },
    signInButtonText: {
      color: '#FFF',
      fontSize: tablet ? 20 : 18,
      fontFamily: 'Roboto',
      fontWeight: '400',
    },
    backButton: {
      height: tablet ? heightPercentageToDP(5) : 50,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: tablet ? 8 : 5,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: '#202239',
    },
    backButtonText: {
      color: '#202239',
      fontSize: tablet ? 20 : 18,
      fontFamily: 'Roboto',
    },
  });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      enableOnAndroid={true}
      extraScrollHeight={isTablet() ? 40 : 20}
      extraHeight={isTablet() ? 150 : 100}
      showsVerticalScrollIndicator={false}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/chorus.png')}
                style={styles.logo}
              />
            </View>

            <Text style={styles.title}>Forgot</Text>
            <Text style={styles.title}>Password ?</Text>

            <Text style={styles.subtitle1}>
              Enter your email and we'll send you an
            </Text>
            <Text style={styles.subtitle2}>OTP to reset your password.</Text>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.email}
                  placeholder="Email address"
                  placeholderTextColor="#C7C7CD"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  selectionColor="#EF652B"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {/* <Image
                source={require("../../assets/images/email.png")}
                style={styles.eyeIcon}
              /> */}
              </View>
            </View>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSubmit}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator
                  size={tablet ? 'large' : 'small'}
                  color="#FFF"
                />
              ) : (
                <Text style={styles.signInButtonText}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}>
              <View style={styles.backButton}>
                <Text style={styles.backButtonText}>Back to Login</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

export default ForgotPasswordScreen;
