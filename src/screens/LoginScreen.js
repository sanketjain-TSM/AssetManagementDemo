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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CheckBox} from 'react-native-elements';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import chorus from '../../assets/images/chorus.png';
import {AppState} from 'react-native';

// Get device dimensions
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive dimension functions
const widthPercentageToDP = widthPercent => {
  const elemWidth =
    typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return (screenWidth * elemWidth) / 100;
};

const heightPercentageToDP = heightPercent => {
  const elemHeight =
    typeof heightPercent === 'number'
      ? heightPercent
      : parseFloat(heightPercent);
  return (screenHeight * elemHeight) / 100;
};

// Device type detection
const isTablet = () => {
  const aspectRatio = screenHeight / screenWidth;
  return screenWidth >= 768 && aspectRatio < 1.6;
};

const isLandscape = () => screenWidth > screenHeight;

const LoginScreen = () => {
  const [isContactUsVisible, setContactUsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isSelected, setSelection] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const navigation = useNavigation();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });

    const checkLogin = async () => {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      if (rememberMe && savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setSelection(true);
        handleLogin(savedEmail, savedPassword);
      }
    };
    checkAuthentication();
    checkLogin();

    return () => subscription?.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const startSession = async () => {
      console.log('Starting user session immediately on authentication');
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.post(
          'https://api.matorg.com/v1/user/session/start',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 200) {
          console.log('User session started immediately on authentication');
        } else {
          console.warn('Unexpected response status:', response.status);
        }
      } catch (error) {
        console.error('Error tracking user session start:', error);
      }
    };

    // Start session when the component mounts
    startSession();

    const handleAppStateChange = async nextAppState => {
      const token = await AsyncStorage.getItem('token');

      if (!token) return;

      if (nextAppState === 'active') {
        // console.log("User Requested to Start Session in Foreground");
        try {
          const response = await axios.post(
            'https://api.matorg.com/v1/user/session/start',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.status === 201) {
            console.log('User session started in foreground');
          } else {
            console.warn('Unexpected response status:', response.status);
          }
        } catch (error) {
          console.error('Error tracking user session start:', error);
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // console.log("User Requested to End Session in Background");
        try {
          const response = await axios.post(
            'https://api.matorg.com/v1/user/session/end',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.status === 201) {
            console.log('User session ended in background');
          } else {
            console.warn('Unexpected response status:', response.status);
          }
        } catch (error) {
          console.error('Error tracking user session end:', error);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]); // Dependency on isAuthenticated

  const checkAuthentication = async () => {
    console.log('Checking authentication status...');
    if (isAuthenticated) {
      navigation.navigate('Main');
    }
  };

  const handleEmailSubmit = async () => {
    Keyboard.dismiss();
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `https://api.matorg.com/v1/auth/initLogin`,
        {
          email: email.toLowerCase(),
        },
      );
      const {hashedUser} = response?.data;
      if (response?.data?.isUserVerified) {
        setIsPasswordRequired(true);
      } else {
        navigation.navigate('OtpScreen', {hashedUser});
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Email is not registered please check.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (savedEmail = null, savedPassword = null) => {
    Keyboard.dismiss();

    setLoading(true);
    try {
      const response = await axios.post(
        `https://api.matorg.com/v1/auth/login`,
        {
          email: email?.toLowerCase() || savedEmail,
          password: password || savedPassword,
        },
      );

      if (response.status === 200) {
        const {accessToken, user} = response.data;
        // Always save these values for the session
        await AsyncStorage.setItem('role', user?.role);
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('firstName', user?.firstName);
        await AsyncStorage.setItem('lastName', user?.lastName);
        await AsyncStorage.setItem('hospitalId', user?.hospitalId);
        await AsyncStorage.setItem('phoneNumber', user?.phoneNumber || '');
        await AsyncStorage.setItem('organization', user?.organizationId || '');

        if (isSelected) {
          // Save email/password only if "Remember Me" is selected
          await AsyncStorage.setItem('savedEmail', email);
          await AsyncStorage.setItem('savedPassword', password);
          await AsyncStorage.setItem('rememberMe', 'true');
        }

        setIsAuthenticated(true);
      } else {
        Alert.alert('Login Failed', 'Invalid login credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'Please check email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactUsModal = () => {
    setContactUsVisible(true);
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:help@chorusview.com');
  };

  // Dynamic styles based on device type
  const getResponsiveStyles = () => {
    const tablet = isTablet();
    const landscape = isLandscape();

    return StyleSheet.create({
      container: {
        padding: tablet ? widthPercentageToDP(5) : 20,
        paddingTop:
          tablet && Platform.OS === 'ios' ? 100 : StatusBar.currentHeight,
        justifyContent: tablet && landscape ? 'flex-start' : 'center',
        paddingBottom: tablet ? heightPercentageToDP(8) : 75,
        minHeight: tablet && landscape ? '100%' : 'auto',
      },
      scrollContainer: {
        backgroundColor: '#FFF',
        flexGrow: 1,
        justifyContent: tablet && landscape ? 'flex-start' : 'center',
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
        color: '#000000',
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

      inputContainer: {
        marginBottom: tablet ? heightPercentageToDP(2) : 10,
      },
      email: {
        height: tablet ? heightPercentageToDP(5) : 50,
        borderRadius: tablet ? 8 : 5,
        paddingHorizontal: tablet ? 20 : 10,
        marginBottom: tablet ? heightPercentageToDP(1) : 10,
        backgroundColor: '#F9F9F9',
        fontSize: tablet ? 18 : 16,
        color: '#000000',
      },
      input: {
        height: tablet ? heightPercentageToDP(5) : 50,
        borderRadius: tablet ? 8 : 5,
        paddingHorizontal: tablet ? 20 : 10,
        marginBottom: tablet ? heightPercentageToDP(1) : 10,
        backgroundColor: '#F9F9F9',
        fontSize: tablet ? 18 : 16,
        paddingRight: tablet ? 60 : 50,
        color: '#000000',
      },
      passwordContainer: {
        position: 'relative',
        justifyContent: 'center',
        marginBottom: tablet ? heightPercentageToDP(1) : 10,
      },
      eyeIcon: {
        position: 'absolute',
        right: tablet ? 20 : 10,
        top: tablet ? heightPercentageToDP(1.8) : 15,
      },
      icon: {
        width: tablet ? 24 : 20,
        height: tablet ? 24 : 20,
      },
      optionsContainer: {
        flexDirection: tablet && landscape ? 'row' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: tablet ? heightPercentageToDP(4) : 30,
        marginTop: tablet ? heightPercentageToDP(1) : -10,
        paddingHorizontal: tablet ? 10 : 0,
      },
      rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: tablet ? 18 : 15,
        marginLeft: tablet ? -24 : -10,
      },
      rememberMeText: {
        marginLeft: tablet ? -12 : -2,
        fontSize: tablet ? 18 : 15,
        opacity: 0.6,
        color: '#000000',
      },
      forgotPasswordText: {
        fontSize: tablet ? 18 : 15,
        fontFamily: 'Roboto',
        fontWeight: '500',
        opacity: 0.6,
        color: '#000000',
      },
      signInButton: {
        height: tablet ? heightPercentageToDP(5) : 50,
        backgroundColor: '#EF652B',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: tablet ? 8 : 5,
        marginBottom: tablet ? heightPercentageToDP(15) : 160,
        marginTop: tablet ? heightPercentageToDP(2) : 0,
      },
      signInButtonText: {
        color: '#FFF',
        fontSize: tablet ? 20 : 18,
        fontFamily: 'Roboto',
        fontWeight: '400',
      },
      optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: tablet ? -heightPercentageToDP(12) : -140,
        marginBottom: tablet ? heightPercentageToDP(8) : 140,
      },
      optionText: {
        fontSize: tablet ? 16 : 14,
        textDecorationLine: 'underline',
        textDecorationColor: 'rgba(0, 0, 0, 0.5)',
      },
      // Modal styles
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      dialogBox: {
        position: 'relative',
        width: tablet ? widthPercentageToDP(50) : 300,
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: tablet ? 15 : 10,
        padding: tablet ? 30 : 20,
        alignItems: 'center',
      },
      dialogTitle: {
        fontSize: tablet ? 22 : 18,
        fontWeight: 'bold',
        marginBottom: tablet ? 15 : 10,
      },
      dialogContent: {
        fontSize: tablet ? 18 : 14,
        marginBottom: tablet ? 25 : 20,
        textAlign: 'center',
        lineHeight: tablet ? 24 : 20,
      },
      closeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        borderRadius: 50,
        top: tablet ? 20 : 14,
        right: tablet ? 22 : 16,
        width: tablet ? 40 : 30,
        height: tablet ? 40 : 30,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      },
      close: {
        width: tablet ? 24 : 20,
        height: tablet ? 24 : 20,
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      },
      button: {
        flex: 1,
        padding: tablet ? 15 : 10,
        borderRadius: tablet ? 8 : 5,
        alignItems: 'center',
        marginHorizontal: tablet ? 8 : 5,
      },
      downloadButton: {
        backgroundColor: '#EF652B',
      },
      buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: tablet ? 18 : 16,
      },
      checkboxContainer: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: tablet ? 8 : 0,
        margin: 0,
      },
    });
  };

  const styles = getResponsiveStyles();

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid={true}
        extraScrollHeight={isTablet() ? 40 : 20}
        extraHeight={isTablet() ? 150 : 100}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            <View style={styles.logoContainer}>
              <Image source={chorus} style={styles.logo} />
            </View>

            <Text style={styles.title}>Let's</Text>
            <Text style={styles.title}>Get Started!</Text>

            <View>
              <Text style={styles.subtitle1}>
                Please enter a valid email
                {isPasswordRequired ? ' and password' : ''}.
              </Text>
            </View>

            <View style={styles.inputContainer}>
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
            </View>

            {/* Conditionally render password input */}
            {isPasswordRequired && (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#C7C7CD"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  selectionColor="#EF652B"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Image
                    source={
                      passwordVisible
                        ? require('../../assets/images/eye-closed.png')
                        : require('../../assets/images/eye-open.png')
                    }
                    style={styles.icon}
                  />
                </TouchableOpacity>
              </View>
            )}

            {isPasswordRequired ? (
              <View style={styles.optionsContainer}>
                <View style={styles.rememberMeContainer}>
                  <CheckBox
                    checked={isSelected}
                    onPress={() => setSelection(!isSelected)}
                    containerStyle={styles.checkboxContainer}
                    size={isTablet() ? 24 : 20}
                    checkedColor="#EF652B"
                  />
                  <Text style={styles.rememberMeText}>Remember Me</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.signInButton}
              onPress={isPasswordRequired ? handleLogin : handleEmailSubmit}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator
                  size={isTablet() ? 'large' : 'small'}
                  color="#FFF"
                />
              ) : (
                <Text style={styles.signInButtonText}>
                  {isPasswordRequired ? 'Sign In Account' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleContactUs}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.optionText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <Modal
        transparent={true}
        visible={isContactUsVisible}
        animationType="fade"
        onRequestClose={() => {
          setContactUsVisible(false);
        }}>
        <TouchableWithoutFeedback onPress={() => setContactUsVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogBox}>
                <TouchableOpacity
                  style={styles.closeContainer}
                  onPress={() => setContactUsVisible(false)}
                  hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
                  <Image
                    source={require(`../../assets/images/close.png`)}
                    style={styles.close}
                  />
                </TouchableOpacity>

                <Text style={styles.dialogTitle}>Reach out to us</Text>
                <Text style={styles.dialogContent}>
                  "Need help? Contact us anytime at help@chorusview.com"
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.downloadButton]}
                    onPress={handleContactUs}
                    activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Contact Us</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default LoginScreen;
