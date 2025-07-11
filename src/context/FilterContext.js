// src/context/FilterContext.js
import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilter = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAssetSelected, setAssetSelected] = useState(false);
  const [isLocationSelected, setLocationSelected] = useState(false);

  const toggleAssetSelection = () => {
    console.log('Toggling Asset Selection');  // Debug log
    setAssetSelected(prev => !prev);
  };

  const toggleLocationSelection = () => {
    console.log('Toggling Location Selection');  // Debug log
    setLocationSelected(prev => !prev);
  };

  const showFilter = () => setIsVisible(true);
  const hideFilter = () => setIsVisible(false);

  return (
    <FilterContext.Provider value={{
      isVisible, showFilter, hideFilter,
      isAssetSelected, toggleAssetSelection,
      isLocationSelected, toggleLocationSelection
    }}>
      {children}
    </FilterContext.Provider>
  );
};
