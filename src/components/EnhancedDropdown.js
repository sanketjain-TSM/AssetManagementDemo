import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import {TouchableWithoutFeedback} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const widthPercentageToDP = widthPercent =>
  (screenWidth * parseFloat(widthPercent)) / 100;
const heightPercentageToDP = heightPercent =>
  (screenHeight * parseFloat(heightPercent)) / 100;
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

// Global dropdown state management
let globalDropdownOpen = null;

const EnhancedDropdown = ({
  label,
  value,
  onSelect,
  items,
  placeholder,
  onAddNew,
  onEdit,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tablet = isTablet();

  const selectedItem = items.find(item => item.value === value);

  const handleItemPress = item => {
    if (item.isAddNew) {
      onAddNew();
    } else {
      onSelect(item.value);
      setIsOpen(false);
      globalDropdownOpen = null;
    }
  };

  // Global dropdown management
  const handleDropdownToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      globalDropdownOpen = null;
    } else {
      // Close any other open dropdown
      if (globalDropdownOpen && globalDropdownOpen !== 'assetDescription') {
        globalDropdownOpen = null;
      }
      setIsOpen(true);
      globalDropdownOpen = 'assetDescription';
    }
  };

  // Close dropdown when another one opens
  useEffect(() => {
    if (
      globalDropdownOpen &&
      globalDropdownOpen !== 'assetDescription' &&
      isOpen
    ) {
      setIsOpen(false);
    }
  }, [globalDropdownOpen, isOpen]);

  // Close dropdown on outside click
  const handleOutsideClick = () => {
    if (isOpen) {
      setIsOpen(false);
      globalDropdownOpen = null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
      // Add z-index to the container when dropdown is open
      zIndex: isOpen ? 9999 : 1,
      elevation: isOpen ? 10 : 1,
    },
    label: {
      fontSize: tablet ? 16 : 14,
      fontWeight: '500',
      marginBottom: 8,
      color: '#333',
    },
    // Add relative positioning to the dropdown wrapper
    dropdownWrapper: {
      position: 'relative',
      zIndex: isOpen ? 9999 : 1,
      backgroundColor: '#fff',
    },
    dropdownButton: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: tablet ? 15 : 12,
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // When dropdown is open, modify border radius to connect with dropdown
      ...(isOpen && {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomColor: 'transparent',
      }),
    },
    dropdownText: {
      fontSize: tablet ? 16 : 14,
      color: selectedItem ? '#333' : '#999',
      flex: 1,
    },
    dropdownArrow: {
      width: 12,
      height: 12,
      tintColor: '#666',
    },
    dropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#ddd',
      borderTopWidth: 0, // Remove top border to connect with button
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      marginTop: 0, // Remove gap to make it connected
      maxHeight: 200,
      zIndex: 99999,
      elevation: 15,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 8,
      // Platform specific shadow
      ...(Platform.OS === 'ios' && {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
      }),
      ...(Platform.OS === 'android' && {
        elevation: 15,
      }),
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      backgroundColor: '#ffffff',
    },
    lastDropdownItem: {
      borderBottomWidth: 0,
    },
    addNewItem: {
      backgroundColor: '#f8f9fa',
      borderTopWidth: 1,
      borderTopColor: '#e9ecef',
    },
    dropdownItemText: {
      fontSize: tablet ? 16 : 14,
      color: '#333',
      flex: 1,
    },
    addNewText: {
      color: '#EF652B',
      fontWeight: '500',
    },
    editButton: {
      backgroundColor: '#EF652B',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginLeft: 10,
    },
    editButtonText: {
      color: '#fff',
      fontSize: tablet ? 12 : 10,
      fontWeight: '500',
    },
    selectedItem: {
      backgroundColor: '#f0f8ff',
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: '#ffffff',
    },
    // Overlay to capture outside clicks
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9998,
    },
  });

  const dropdownItems = [
    {
      label: '+ Add New Description',
      value: 'add_new',
      isAddNew: true,
    },
    ...items,
  ];

  return (
    <>
      {/* Overlay to handle outside clicks */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={handleDropdownToggle}
            disabled={loading}>
            <Text
              style={[
                styles.dropdownText,
                {color: selectedItem ? '#333' : '#999'},
              ]}>
              {selectedItem ? selectedItem.label : placeholder}
            </Text>
            {/* Add a simple arrow indicator */}
            <Text
              style={{
                fontSize: 16,
                color: '#666',
                transform: [{rotate: isOpen ? '180deg' : '0deg'}],
              }}>
              ▼
            </Text>
          </TouchableOpacity>

          {isOpen && (
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.dropdownList}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#EF652B" />
                  </View>
                ) : (
                  <FlatList
                    data={dropdownItems}
                    keyExtractor={item => item.value.toString()}
                    renderItem={({item, index}) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          index === dropdownItems.length - 1 &&
                            styles.lastDropdownItem,
                          item.isAddNew && styles.addNewItem,
                          item.value === value && styles.selectedItem,
                        ]}
                        onPress={() => handleItemPress(item)}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            item.isAddNew && styles.addNewText,
                          ]}>
                          {item.label}
                        </Text>
                        {!item.isAddNew && (
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => onEdit(item)}>
                            <Text style={styles.editButtonText}>Edit</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    )}
                    nestedScrollEnabled={true}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    </>
  );
};

export default EnhancedDropdown;
