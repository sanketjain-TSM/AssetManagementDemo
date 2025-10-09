import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = () => screenWidth >= 768 && screenHeight / screenWidth < 1.6;

let globalDropdownOpen = null;

const EnhancedDropdown = ({
  label,
  value,
  onSelect,
  items = [],
  placeholder,
  onAddNew,
  onEdit,
  loading = false,
  dropdownId = 'assetDescription',
  maxListHeight = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const buttonWrapperRef = useRef(null);

  const selectedItem = items.find(i => i.value === value);

  const openDropdown = () => {
    if (globalDropdownOpen && globalDropdownOpen !== dropdownId) {
      globalDropdownOpen = null;
    }

    try {
      buttonWrapperRef.current?.measureInWindow((x, y, width, height) => {
        setCoords({x, y, width, height});
        setIsOpen(true);
        globalDropdownOpen = dropdownId;
      });
    } catch (e) {
      setCoords(null);
      setIsOpen(true);
      globalDropdownOpen = dropdownId;
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    globalDropdownOpen = null;
  };

  useEffect(() => {
    if (globalDropdownOpen && globalDropdownOpen !== dropdownId && isOpen) {
      setIsOpen(false);
    }
  }, [globalDropdownOpen, dropdownId, isOpen]);

  const handleItemPress = item => {
    if (item.isAddNew) {
      onAddNew?.();
    } else {
      onSelect?.(item.value);
    }
    closeDropdown();
  };

  const computeListStyle = () => {
    if (!coords) {
      const width = Math.min(360, screenWidth - 32);
      return {
        containerStyle: {
          left: (screenWidth - width) / 2,
          top: Math.max(
            24,
            (screenHeight - Math.min(maxListHeight, items.length * 48)) / 2,
          ),
          width,
        },
        listMaxHeight: Math.min(maxListHeight, screenHeight - 48),
      };
    }

    const spaceBelow = screenHeight - (coords.y + coords.height) - 8;
    const spaceAbove = coords.y - 8;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    const listMax = Math.min(maxListHeight, Math.max(120, available));
    const width = Math.min(coords.width, screenWidth - 16);

    const top = openUp ? coords.y - listMax - 4 : coords.y + coords.height + 4;

    const boundedTop = Math.max(8, Math.min(top, screenHeight - listMax - 8));

    return {
      containerStyle: {
        left: Math.max(8, Math.min(coords.x, screenWidth - width - 8)),
        top: boundedTop,
        width,
      },
      listMaxHeight: listMax,
    };
  };

  const {containerStyle, listMaxHeight} = computeListStyle();

  const dropdownItems = [
    {label: '+ Add New Description', value: 'add_new', isAddNew: true},
    ...items,
  ];

  return (
    <>
      <View style={[styles.container, {zIndex: isOpen ? 9999 : 1}]}>
        <Text style={styles.label}>{label}</Text>

        {/* wrapper we measure */}
        <View ref={buttonWrapperRef} collapsable={false}>
          <TouchableOpacity
            style={[styles.button, isOpen && styles.buttonOpen]}
            onPress={() => {
              if (isOpen) closeDropdown();
              else openDropdown();
            }}
            activeOpacity={0.8}
            disabled={loading}>
            <Text
              style={[
                styles.buttonText,
                {color: selectedItem ? '#333' : '#999'},
              ]}>
              {selectedItem ? selectedItem.label : placeholder}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#666',
                transform: [{rotate: isOpen ? '180deg' : '0deg'}],
              }}>
              ▼
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal portal for dropdown list so it sits above everything and receives touches */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={closeDropdown}>
        {/* overlay to dismiss when tapping outside */}
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        {/* positioned list */}
        <View
          style={[
            styles.modalContainer,
            containerStyle,
            {maxHeight: listMaxHeight},
          ]}>
          <View style={styles.listBox}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#EF652B" />
              </View>
            ) : (
              <FlatList
                data={dropdownItems}
                keyExtractor={item => item.value.toString()}
                renderItem={({item, index}) => (
                  <View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.item,
                        index === dropdownItems.length - 1 && styles.lastItem,
                        item.isAddNew && styles.addNewItem,
                        item.value === value && styles.selectedItem,
                      ]}
                      onPress={() => handleItemPress(item)}>
                      <Text
                        style={[
                          styles.itemText,
                          item.isAddNew && styles.addNewText,
                        ]}>
                        {item.label}
                      </Text>

                      {/* edit button (does NOT close dropdown) */}
                      {!item.isAddNew && (
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            onEdit?.(item);
                          }}>
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                nestedScrollEnabled={true}
                scrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{paddingVertical: 4}}
                style={{flexGrow: 0}}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: isTablet() ? 18 : 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  button: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonText: {
    fontSize: isTablet() ? 16 : 14,
    flex: 1,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    position: 'absolute',

    zIndex: 99999,
    elevation: 20,
    backgroundColor: 'transparent',
  },
  listBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 15,
      },
    }),
  },

  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  addNewItem: {
    backgroundColor: '#f8f9fa',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  addNewText: {
    color: '#EF652B',
    fontWeight: '500',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
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
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EnhancedDropdown;
