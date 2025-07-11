import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

const DynamicInputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  scannable = false,
  useDropdown = false,
  dropdownItems = [],
  multiline = false,
  editable = true,
  storageKey, // Key to store/retrieve auto-suggestions
  style,
  inputStyle,
  validationState, // 'validating', 'valid', 'invalid', null
  validationMessage,
  showValidationIcon = false,
  ...props
}) => {
  // Always declare all hooks at the top level
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const inputRef = useRef(null);
  const tablet = isTablet();

  // Memoized validation color
  const validationColor = useMemo(() => {
    switch (validationState) {
      case 'valid':
        return '#4CAF50';
      case 'invalid':
        return '#F44336';
      case 'validating':
        return '#EF652B';
      default:
        return '#D9D9D9';
    }
  }, [validationState]);

  // Always call useEffect hooks with proper dependencies
  useEffect(() => {
    if (scannable) {
      requestCameraPermission();
    }
  }, [scannable]);

  useEffect(() => {
    if (storageKey) {
      loadSuggestions();
    }
  }, [storageKey]);

  useEffect(() => {
    if (JSON.stringify(items) !== JSON.stringify(dropdownItems)) {
      setItems(dropdownItems);
    }
  }, [dropdownItems]);

  const requestCameraPermission = useCallback(async () => {
    try {
      // For now, we'll simulate permission - replace with actual camera permission logic
      setHasPermission(true);
      // You can implement actual camera permission logic here
      // const permission = await Camera.requestCameraPermission();
      // setHasPermission(permission === 'authorized');
    } catch (error) {
      console.log('Camera permission error:', error);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    if (!storageKey) return;
    try {
      const stored = await AsyncStorage.getItem(`suggestions_${storageKey}`);
      if (stored) {
        setSuggestions(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading suggestions:', error);
    }
  }, [storageKey]);

  const saveToSuggestions = useCallback(
    async newValue => {
      if (!storageKey || !newValue.trim()) return;

      try {
        const currentSuggestions = suggestions.filter(
          item => item.toLowerCase() !== newValue.toLowerCase(),
        );
        const updatedSuggestions = [newValue, ...currentSuggestions].slice(
          0,
          10,
        ); // Keep last 10
        setSuggestions(updatedSuggestions);
        await AsyncStorage.setItem(
          `suggestions_${storageKey}`,
          JSON.stringify(updatedSuggestions),
        );
      } catch (error) {
        console.log('Error saving suggestions:', error);
      }
    },
    [storageKey, suggestions],
  );

  const handleInputChange = useCallback(
    text => {
      onChangeText(text);

      if (storageKey && text.length > 0) {
        const filtered = suggestions.filter(item =>
          item.toLowerCase().includes(text.toLowerCase()),
        );
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    },
    [onChangeText, storageKey, suggestions],
  );

  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow selection
    setTimeout(() => setShowSuggestions(false), 200);
    if (value && value.trim()) {
      saveToSuggestions(value.trim());
    }
  }, [value, saveToSuggestions]);

  const selectSuggestion = useCallback(
    item => {
      onChangeText(item);
      setShowSuggestions(false);
      inputRef.current?.blur();
    },
    [onChangeText],
  );

  const openCamera = useCallback(() => {
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to scan codes.',
        [
          {text: 'Cancel'},
          {text: 'OK', onPress: () => requestCameraPermission()},
        ],
      );
      return;
    }

    // For demo purposes, we'll simulate a scan result
    // Replace this with actual camera implementation
    Alert.alert(
      'Scanner',
      'Camera scanner would open here. For demo, enter a test value?',
      [
        {text: 'Cancel'},
        {
          text: 'Demo Scan',
          onPress: () => {
            const demoValue = `SCAN_${Date.now().toString().slice(-4)}`;
            onChangeText(demoValue);
            saveToSuggestions(demoValue);
          },
        },
      ],
    );
  }, [hasPermission, requestCameraPermission, onChangeText, saveToSuggestions]);

  const renderValidationIcon = useCallback(() => {
    if (!showValidationIcon) return null;

    switch (validationState) {
      case 'validating':
        return (
          <View style={styles.validationIcon}>
            <Icon name="sync" size={16} color="#EF652B" />
          </View>
        );
      case 'valid':
        return (
          <View style={styles.validationIcon}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
          </View>
        );
      case 'invalid':
        return (
          <View style={styles.validationIcon}>
            <Icon name="error" size={16} color="#F44336" />
          </View>
        );
      default:
        return null;
    }
  }, [showValidationIcon, validationState]);

  // Memoized styles to prevent recreation on every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          marginBottom: tablet ? 25 : 20,
          zIndex: useDropdown && open ? 3000 : 1,
        },
        label: {
          fontSize: tablet ? 18 : 16,
          fontWeight: '400',
          marginBottom: 8,
          color: '#0E0E0E',
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: validationColor,
          borderRadius: 5,
          backgroundColor: '#fff',
          position: 'relative',
        },
        input: {
          flex: 1,
          height: tablet ? 60 : 50,
          padding: 12,
          fontSize: tablet ? 17 : 15,
          fontWeight: '400',
          color: '#0E0E0E',
          opacity: editable ? 1 : 0.5,
        },
        multilineInput: {
          height: tablet ? 80 : 70,
          textAlignVertical: 'top',
        },
        scanButton: {
          padding: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        validationIcon: {
          paddingHorizontal: 8,
          justifyContent: 'center',
          alignItems: 'center',
        },
        validationMessage: {
          fontSize: 12,
          marginTop: 4,
          marginLeft: 4,
        },
        validationMessageValid: {
          color: '#4CAF50',
        },
        validationMessageInvalid: {
          color: '#F44336',
        },
        suggestionsContainer: {
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#D9D9D9',
          borderTopWidth: 0,
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
          maxHeight: 150,
          zIndex: 2000,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        suggestionItem: {
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        },
        suggestionText: {
          fontSize: tablet ? 16 : 14,
          color: '#0E0E0E',
        },
        dropdown: {
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: validationColor,
          borderRadius: 5,
          height: tablet ? 60 : 50,
        },
        dropdownDisabled: {
          backgroundColor: '#F9F9F9',
          opacity: 0.5,
        },
        dropdownLoading: {
          backgroundColor: '#F5F5F5',
          borderColor: '#DDD',
        },
      }),
    [tablet, useDropdown, open, validationColor, editable],
  );

  // Suggestions List Component
  const SuggestionsList = useCallback(() => {
    if (!showSuggestions || !suggestions.length) return null;

    const filteredSuggestions = suggestions.filter(item =>
      item.toLowerCase().includes(value.toLowerCase()),
    );

    if (!filteredSuggestions.length) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <FlatList
          data={filteredSuggestions}
          keyExtractor={(item, index) => `${item}_${index}`}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item)}>
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          )}
          nestedScrollEnabled
        />
      </View>
    );
  }, [showSuggestions, suggestions, value, styles, selectSuggestion]);

  // Validation Message Component
  const ValidationMessage = useCallback(() => {
    if (!validationMessage || !showValidationIcon) return null;

    return (
      <Text
        style={[
          styles.validationMessage,
          validationState === 'valid'
            ? styles.validationMessageValid
            : styles.validationMessageInvalid,
        ]}>
        {validationMessage}
      </Text>
    );
  }, [validationMessage, showValidationIcon, validationState, styles]);

  // Dropdown Component
  if (useDropdown) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.label}>{label}</Text>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={onChangeText}
          setItems={setItems}
          disabled={!editable}
          placeholder={placeholder}
          style={[
            styles.dropdown,
            !editable && styles.dropdownDisabled,
            inputStyle,
          ]}
          containerStyle={{marginBottom: open ? 100 : 0}}
          zIndex={3000}
          zIndexInverse={1000}
          dropDownContainerStyle={{
            borderColor: validationColor,
          }}
          {...props}
        />
        <ValidationMessage />
      </View>
    );
  }

  // Regular Input Component
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
          value={value}
          onChangeText={handleInputChange}
          onFocus={() => {
            if (storageKey && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          placeholderTextColor="#999"
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? 2 : 1}
          {...props}
        />
        {renderValidationIcon()}
        {scannable && editable && (
          <TouchableOpacity style={styles.scanButton} onPress={openCamera}>
            <Icon name="qr-code-scanner" size={24} color="#EF652B" />
          </TouchableOpacity>
        )}
      </View>

      <ValidationMessage />
      <SuggestionsList />
    </View>
  );
};

export default DynamicInputField;
