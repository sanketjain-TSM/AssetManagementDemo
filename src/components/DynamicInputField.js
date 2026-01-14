import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Keyboard,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModernQRScannerModal from './ModernQRScannerModal';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

// Move base styles outside component to prevent recreation
const createStyles = (
  tablet,
  validationColor,
  editable,
  useAddEdit,
  useDropdown,
  open,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginBottom: tablet ? 25 : 20,
      zIndex: useDropdown && open ? 5000 : 1,
    },
    label: {
      fontSize: tablet ? 18 : 16,
      fontWeight: '500',
      marginBottom: 8,
      color: '#0E0E0E',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: validationColor,
      borderRadius: 8,
      backgroundColor: '#fff',
      position: 'relative',
    },
    qrScanButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrScanButtonText: {
      color: '#0E0E0E',
      fontSize: 12,
      fontWeight: '500',
    },
    input: {
      flex: 1,
      height: tablet ? 56 : 48,
      paddingHorizontal: 12,
      fontSize: tablet ? 16 : 14,
      color: '#0E0E0E',
      opacity: editable ? 1 : 0.6,
    },
    multilineInput: {
      height: tablet ? 80 : 70,
      textAlignVertical: 'top',
      paddingTop: 12,
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
    // Enhanced dropdown styles (same as EnhancedDropdown component)
    dropdownWrapper: {
      position: 'relative',
      zIndex: open ? 9999 : 1,
    },
    dropdownButton: {
      borderWidth: 1,
      borderColor: validationColor,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: tablet ? 15 : 12,
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // When dropdown is open, modify border radius to connect with dropdown
      ...(open && {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomColor: 'transparent',
      }),
    },
    dropdownText: {
      fontSize: tablet ? 16 : 14,
      color: '#333',
      flex: 1,
    },
    dropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: validationColor,
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
    dropdownItemText: {
      fontSize: tablet ? 16 : 14,
      color: '#333',
      flex: 1,
    },
    selectedItem: {
      backgroundColor: '#f0f8ff',
    },
    // Legacy dropdown styles (for backward compatibility)
    dropdown: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: validationColor,
      borderRadius: 8,
      height: tablet ? 56 : 48,
      paddingRight: useAddEdit ? 80 : 12,
    },
    dropdownContainer: {
      position: 'relative',
    },
    dropdownAddButton: {
      position: 'absolute',
      right: 8,
      top: 4,
      width: 40,
      height: tablet ? 48 : 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8F8F8',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      zIndex: 10000,
      elevation: 10,
    },
    dropdownItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    selectedText: {
      color: '#4CAF50',
      fontWeight: '500',
    },
    dropdownItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dropdownItemAction: {
      padding: 6,
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 24,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 20,
      textAlign: 'center',
      color: '#0E0E0E',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 20,
      color: '#0E0E0E',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: '#F5F5F5',
    },
    modalButtonSubmit: {
      backgroundColor: '#4CAF50',
    },
    modalButtonTextCancel: {
      fontSize: 16,
      fontWeight: '500',
      color: '#666',
    },
    modalButtonTextSubmit: {
      fontSize: 16,
      fontWeight: '500',
      color: '#fff',
    },
  });

// Global dropdown state management
let globalDropdownOpen = null;

const DynamicInputField = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    useDropdown = false,
    dropdownItems = [],
    useAddEdit = false,
    isDeleteEnabledInDropdown = false,
    multiline = false,
    editable = true,
    storageKey,
    style,
    inputStyle,
    validationState,
    validationMessage,
    showValidationIcon = false,
    onDropdownItemsChange,
    enableQRScan = false,
    qrScanTitle = 'Scan QR Code',
    qrScanSubtitle = 'Position the QR code within the frame',
    ...props
  }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newItemText, setNewItemText] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);

    const inputRef = useRef(null);
    const modalInputRef = useRef(null);

    console.log('dropdownItems', dropdownItems);

    // Use stable refs for callbacks to prevent useEffect re-runs
    const onChangeTextRef = useRef(onChangeText);
    const onDropdownItemsChangeRef = useRef(onDropdownItemsChange);
    const tablet = isTablet();

    // Only update refs when functions actually change
    useEffect(() => {
      onChangeTextRef.current = onChangeText;
    }, [onChangeText]);

    useEffect(() => {
      onDropdownItemsChangeRef.current = onDropdownItemsChange;
    }, [onDropdownItemsChange]);

    // Memoize dropdownItems to prevent infinite loops
    const memoizedDropdownItems = useMemo(() => {
      return Array.isArray(dropdownItems) ? dropdownItems : [];
    }, [dropdownItems]);

    // Memoize validation color
    const validationColor = useMemo(() => {
      switch (validationState) {
        case 'valid':
          return '#4CAF50';
        case 'invalid':
          return '#F44336';
        case 'validating':
          return '#FF9800';
        default:
          return '#D9D9D9';
      }
    }, [validationState]);

    // Memoize styles with reduced dependencies
    const styles = useMemo(
      () =>
        createStyles(
          tablet,
          validationColor,
          editable,
          useAddEdit,
          useDropdown,
          open,
        ),
      [tablet, validationColor, editable, useAddEdit, useDropdown, open],
    );

    // Global dropdown management
    const handleDropdownToggle = useCallback(() => {
      if (open) {
        setOpen(false);
        globalDropdownOpen = null;
      } else {
        // Close any other open dropdown
        if (globalDropdownOpen && globalDropdownOpen !== storageKey) {
          globalDropdownOpen = null;
        }
        setOpen(true);
        globalDropdownOpen = storageKey || 'default';
      }
    }, [open, storageKey]);

    // Close dropdown when another one opens
    useEffect(() => {
      if (
        globalDropdownOpen &&
        globalDropdownOpen !== (storageKey || 'default') &&
        open
      ) {
        setOpen(false);
      }
    }, [globalDropdownOpen, storageKey, open]);

    // Stable callback for loading dropdown items - removed memoizedDropdownItems dependency
    const loadDropdownItems = useCallback(async () => {
      if (!useAddEdit || !storageKey) return [];

      try {
        const stored = await AsyncStorage.getItem(
          `dropdown_items_${storageKey}`,
        );
        if (stored) {
          const storedItems = JSON.parse(stored);
          if (Array.isArray(storedItems)) {
            return storedItems;
          }
        }
        return [];
      } catch (error) {
        console.log('Error loading dropdown items:', error);
        return [];
      }
    }, [useAddEdit, storageKey]);

    // Initialize component only once
    useEffect(() => {
      let isMounted = true;

      const initializeComponent = async () => {
        if (useDropdown) {
          if (storageKey && useAddEdit) {
            // Load stored items and merge with default items
            const storedItems = await loadDropdownItems();
            const merged = [...dropdownItems, ...storedItems];

            // Add default items that aren't already in stored items
            memoizedDropdownItems.forEach(item => {
              if (!merged.find(stored => stored.value === item.value)) {
                merged.push(item);
              }
            });

            if (isMounted) {
              setItems(merged);
            }
          } else {
            // Just use the memoized dropdown items
            if (isMounted) {
              setItems(memoizedDropdownItems, ...dropdownItems);
            }
          }
        }

        if (isMounted) {
          setIsInitialized(true);
        }
      };

      initializeComponent();

      return () => {
        isMounted = false;
      };
    }, []); // Empty dependency array - only run once

    // Separate effect to handle updates to dropdownItems prop
    useEffect(() => {
      if (!isInitialized) return;

      // Only update if not using stored items
      if (!useAddEdit || !storageKey) {
        setItems(prevItems => {
          const itemsChanged =
            JSON.stringify(prevItems) !== JSON.stringify(memoizedDropdownItems);
          return itemsChanged ? memoizedDropdownItems : prevItems;
        });
      }
    }, [memoizedDropdownItems, useAddEdit, storageKey, isInitialized]);

    const saveDropdownItems = useCallback(
      async updatedItems => {
        if (!useAddEdit || !storageKey) return;
        try {
          await AsyncStorage.setItem(
            `dropdown_items_${storageKey}`,
            JSON.stringify(updatedItems),
          );
          onDropdownItemsChangeRef.current?.(updatedItems);
        } catch (error) {
          console.log('Error saving dropdown items:', error);
        }
      },
      [useAddEdit, storageKey],
    );

    // CRITICAL: Stable input change handler
    const handleInputChange = useCallback(text => {
      // Don't create new function reference on every call
      if (onChangeTextRef.current) {
        onChangeTextRef.current(text);
      }
    }, []); // Empty dependency array makes this stable

    const handleQRScan = useCallback(scannedData => {
      console.log('QR Scan result:', scannedData);
      if (onChangeTextRef.current) {
        onChangeTextRef.current(scannedData);
      }
    }, []);

    const openQRScanner = useCallback(() => {
      console.log('QR Scanner button pressed');
      setShowQRScanner(true);
    }, []);

    const closeQRScanner = useCallback(() => {
      setShowQRScanner(false);
    }, []);

    const openAddEditModal = useCallback((item = null) => {
      setEditingItem(item);
      setNewItemText(item?.label || '');
      setShowAddEditModal(true);
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 300);
    }, []);

    const closeAddEditModal = useCallback(() => {
      Keyboard.dismiss();
      setShowAddEditModal(false);
      setEditingItem(null);
      setNewItemText('');
    }, []);

    const handleAddEditSubmit = useCallback(async () => {
      if (!newItemText.trim()) return;

      Keyboard.dismiss();

      const newItem = {
        label: newItemText.trim(),
        value: editingItem
          ? editingItem.value
          : newItemText.trim().toLowerCase().replace(/\s+/g, '_'),
      };

      setItems(prevItems => {
        let updatedItems;
        if (editingItem) {
          updatedItems = prevItems.map(item =>
            item.value === editingItem.value ? newItem : item,
          );
        } else {
          const exists = prevItems.find(item => item.value === newItem.value);
          if (exists) {
            Alert.alert('Error', 'Item already exists!');
            return prevItems;
          }
          updatedItems = [newItem, ...prevItems];
        }

        saveDropdownItems(updatedItems);
        return updatedItems;
      });

      if (onChangeTextRef.current) {
        onChangeTextRef.current(newItem.value);
      }
      closeAddEditModal();
    }, [newItemText, editingItem, saveDropdownItems, closeAddEditModal]);

    const handleDeleteItem = useCallback(
      async itemToDelete => {
        Alert.alert(
          'Delete Item',
          `Are you sure you want to delete "${itemToDelete.label}"?`,
          [
            {text: 'Cancel'},
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                setItems(prevItems => {
                  const updatedItems = prevItems.filter(
                    item => item.value !== itemToDelete.value,
                  );
                  saveDropdownItems(updatedItems);
                  return updatedItems;
                });

                if (value === itemToDelete.value && onChangeTextRef.current) {
                  onChangeTextRef.current('');
                }
              },
            },
          ],
        );
      },
      [value, saveDropdownItems],
    );

    const renderValidationIcon = useCallback(() => {
      if (!showValidationIcon) return null;

      const iconMap = {
        validating: 'refresh',
        valid: 'check-circle',
        invalid: 'error',
      };

      const iconName = iconMap[validationState];
      if (!iconName) return null;

      return (
        <View style={styles.validationIcon}>
          <Icon name={iconName} size={16} color={validationColor} />
        </View>
      );
    }, [
      showValidationIcon,
      validationState,
      validationColor,
      styles.validationIcon,
    ]);

    const renderDropdownItem = useCallback(
      ({item, isSelected}) => {
        if (!useAddEdit) return null;

        return (
          <View style={styles.dropdownItemContainer}>
            <Text
              style={[
                styles.dropdownItemText,
                isSelected && styles.selectedText,
              ]}>
              {item.label}
            </Text>
            <View style={styles.dropdownItemActions}>
              <TouchableOpacity
                style={styles.dropdownItemAction}
                onPress={() => openAddEditModal(item)}>
                <Icon name="edit" size={16} color="#666" />
              </TouchableOpacity>
              {isDeleteEnabledInDropdown && (
                <TouchableOpacity
                  style={styles.dropdownItemAction}
                  onPress={() => handleDeleteItem(item)}>
                  <Icon name="delete" size={16} color="#F44336" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      },
      [
        useAddEdit,
        isDeleteEnabledInDropdown,
        openAddEditModal,
        handleDeleteItem,
        styles,
      ],
    );

    const ValidationMessage = useCallback(() => {
      if (!validationMessage || !showValidationIcon) return null;

      return (
        <Text style={[styles.validationMessage, {color: validationColor}]}>
          {validationMessage}
        </Text>
      );
    }, [
      validationMessage,
      showValidationIcon,
      validationColor,
      styles.validationMessage,
    ]);

    const AddEditModal = useCallback(
      () => (
        <Modal
          visible={showAddEditModal}
          transparent
          animationType="fade"
          onRequestClose={closeAddEditModal}
          statusBarTranslucent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TextInput
                ref={modalInputRef}
                style={styles.modalInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Enter item name"
                placeholderTextColor="#999"
                returnKeyType="done"
                blurOnSubmit={false}
                selectTextOnFocus={true}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={closeAddEditModal}>
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit]}
                  onPress={handleAddEditSubmit}>
                  <Text style={styles.modalButtonTextSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ),
      [
        showAddEditModal,
        editingItem,
        newItemText,
        closeAddEditModal,
        handleAddEditSubmit,
        styles,
      ],
    );

    // Show loading state until initialized
    if (!isInitialized) {
      return (
        <View style={[{width: '100%', marginBottom: tablet ? 25 : 20}, style]}>
          <Text style={{fontSize: tablet ? 18 : 16, color: '#0E0E0E'}}>
            {label}
          </Text>
          <View
            style={{
              height: tablet ? 56 : 48,
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: 8,
              backgroundColor: '#F9F9F9',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{color: '#999'}}>Loading...</Text>
          </View>
        </View>
      );
    }

    // Dropdown render
    if (useDropdown) {
      const selectedItem = items.find(item => item.value === value);

      // Close dropdown on outside click
      const handleOutsideClick = () => {
        if (open) {
          setOpen(false);
          globalDropdownOpen = null;
        }
      };

      return (
        <>
          {/* Overlay to handle outside clicks */}
          {open && (
            <TouchableWithoutFeedback onPress={handleOutsideClick}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>
          )}

          <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={handleDropdownToggle}
                disabled={!editable}>
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
                    transform: [{rotate: open ? '180deg' : '0deg'}],
                  }}>
                  ▼
                </Text>
              </TouchableOpacity>

              {open && (
                <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                  <View style={styles.dropdownList}>
                    <FlatList
                      data={items}
                      keyExtractor={item => item.value.toString()}
                      renderItem={({item, index}) => (
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            index === items.length - 1 &&
                              styles.lastDropdownItem,
                            item.value === value && styles.selectedItem,
                          ]}
                          onPress={() => {
                            if (onChangeTextRef.current) {
                              onChangeTextRef.current(item.value);
                            }
                            setOpen(false);
                            globalDropdownOpen = null;
                          }}>
                          <Text style={styles.dropdownItemText}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      )}
                      nestedScrollEnabled={true}
                    />
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>
            <ValidationMessage />
          </View>
        </>
      );
    }

    // Regular input render
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              inputStyle,
            ]}
            value={value}
            onChangeText={handleInputChange}
            placeholder={placeholder}
            placeholderTextColor="#999"
            editable={editable}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            {...props}
          />
          {renderValidationIcon()}
          {enableQRScan && (
            <TouchableOpacity
              style={styles.qrScanButton}
              onPress={openQRScanner}
              disabled={!editable}>
              <Icon name="qr-code-scanner" size={16} color="#0E0E0E" />
            </TouchableOpacity>
          )}
        </View>
        <ValidationMessage />

        {/* QR Scanner Modal */}
        {enableQRScan && (
          <ModernQRScannerModal
            visible={showQRScanner}
            onClose={closeQRScanner}
            onScan={handleQRScan}
            title={qrScanTitle}
            subtitle={qrScanSubtitle}
          />
        )}
      </View>
    );
  },
);

// Add display name for debugging
DynamicInputField.displayName = 'DynamicInputField';

export default DynamicInputField;
