import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableNativeFeedback,
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
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import chorus from '../../assets/images/chorus.png';

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

const OtpVerificationScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otpResent, setOtpResent] = useState(false);
  const countdownRef = useRef();
  const inputs = useRef([]);
  const navigation = useNavigation();
  const route = useRoute();
  const {hashedUser, email} = route.params;

  const handleOtpChange = (text, index) => {
    const otpArray = [...otp];
    otpArray[index] = text;
    setOtp(otpArray);

    if (text && index < otpArray.length - 1) {
      inputs.current[index + 1].focus();
    }
    if (!text && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev === 1) {
          clearInterval(countdownRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.matorg.com/v1/auth/verifyOtp',
        {
          hashedUser: hashedUser.toLowerCase(),
          otp: otpString,
        },
      );
      if (response.status === 200) {
        const {access_token} = response.data?.token;
        await AsyncStorage.setItem('token', access_token);
        navigation.navigate('CreatePassword', {access_token});
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer) return;
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.matorg.com/v1/auth/forgotPassword',
        {email},
      );
      if (response.status === 200) {
        setTimer(60);
        clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev === 1) {
              clearInterval(countdownRef.current);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        Alert.alert('Success', 'OTP has been sent to your email.');
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
  const ButtonComponent =
    Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: tablet ? widthPercentageToDP(5) : 20,
      paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
      justifyContent: tablet && landscape ? 'flex-start' : 'center',
    },
    backButton: {
      position: 'absolute',
      top: tablet ? 40 : 20,
      left: 0,
      width: 44,
      height: 44,
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
    titleContainer: {
      marginTop: tablet ? heightPercentageToDP(15) : heightPercentageToDP(15),
    },
    logoContainer: {
      flexDirection: 'row',
      marginBottom: tablet ? heightPercentageToDP(0) : 20,
      justifyContent: 'flex-start',
    },
    logo: {
      marginBottom: tablet
        ? landscape
          ? heightPercentageToDP(15)
          : heightPercentageToDP(8)
        : heightPercentageToDP(6),
      marginTop: tablet ? heightPercentageToDP(12) : 50,
      transform: tablet ? [{scale: landscape ? 1.2 : 1.5}] : [{scale: 1}],
    },
    title: {
      fontSize: tablet ? (landscape ? 36 : 48) : 42,
      fontWeight: '600',
      textAlign: 'left',
      color: '#000000',
    },
    subtitle1: {
      fontSize: tablet ? 18 : 15,
      textAlign: 'left',
      marginBottom: tablet ? heightPercentageToDP(4) : 2,
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
      marginBottom: tablet ? heightPercentageToDP(4) : 2,
      fontFamily: 'Roboto',
      opacity: 0.5,
      marginLeft: tablet ? 0 : 3,
      color: '#000000',
    },
    subTitleContainer: {
      marginVertical: tablet ? heightPercentageToDP(4) : 30,
      opacity: 0.7,
    },
    subtitle: {
      fontSize: tablet ? 18 : 15,
      textAlign: 'left',
      fontFamily: 'Roboto',
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: tablet ? heightPercentageToDP(4) : 20,
    },
    otpInput: {
      borderRadius: 5,
      width: tablet ? 80 : 70,
      height: tablet ? heightPercentageToDP(5) : 50,
      textAlign: 'center',
      fontSize: tablet ? 24 : 20,
      paddingHorizontal: 5,
      backgroundColor: '#F9F9F9',
    },
    verifyButton: {
      height: tablet ? heightPercentageToDP(5) : 50,
      backgroundColor: '#EF652B',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: tablet ? 8 : 5,
      marginBottom: tablet ? heightPercentageToDP(3) : 20,
      marginTop: tablet ? heightPercentageToDP(2) : 20,
    },
    verifyButtonText: {
      color: '#FFF',
      fontSize: tablet ? 20 : 18,
      fontFamily: 'Roboto',
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
    resendText: {
      color: 'black',
      fontSize: tablet ? 20 : 18,
      fontFamily: 'Roboto',
      textAlign: 'right',
      textDecorationLine: 'underline',
    },
  });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      enableOnAndroid={true}
      extraScrollHeight={isTablet() ? 40 : 20}
      extraHeight={isTablet() ? 150 : 100}
      showsVerticalScrollIndicator={false}>
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
        style={{backgroundColor: '#FFF'}}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            <View style={styles.logoContainer}>
              <Image source={chorus} style={styles.logo} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Verification</Text>
              <Text style={styles.title}>Code!</Text>
            </View>

            <View style={styles.subTitleContainer}>
              <Text style={styles.subtitle1}>
                We have sent an OTP to your registered email,
              </Text>
              <Text style={styles.subtitle2}>Please enter OTP here</Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={el => (inputs.current[index] = el)}
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={text => handleOtpChange(text, index)}
                  value={digit}
                  autoFocus={index === 0}
                  selectionColor="#EF652B"
                />
              ))}
            </View>

            <TouchableOpacity
              disabled={!!timer}
              onPress={handleResendOtp}
              activeOpacity={timer ? 1 : 0.8}>
              <Text style={styles.resendText}>
                Resend OTP{timer ? ` in (${timer}s)` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator
                  size={tablet ? 'large' : 'small'}
                  color="#FFF"
                />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
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

export default OtpVerificationScreen;
