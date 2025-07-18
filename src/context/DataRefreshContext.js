import React, {createContext, useContext, useState, useCallback} from 'react';

const DataRefreshContext = createContext();

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};

export const DataRefreshProvider = ({children}) => {
  const [refreshTriggers, setRefreshTriggers] = useState({
    assets: 0,
    location: 0,
    department: 0,
    search: 0,
  });

  // Trigger refresh for specific data types
  const triggerRefresh = useCallback(dataType => {
    setRefreshTriggers(prev => ({
      ...prev,
      [dataType]: prev[dataType] + 1,
    }));
  }, []);

  // Trigger refresh for all data types
  const triggerAllRefresh = useCallback(() => {
    setRefreshTriggers(prev => ({
      assets: prev.assets + 1,
      location: prev.location + 1,
      department: prev.department + 1,
      search: prev.search + 1,
    }));
  }, []);

  // Trigger refresh for asset-related operations
  const triggerAssetRefresh = useCallback(() => {
    triggerAllRefresh();
  }, [triggerAllRefresh]);

  const value = {
    refreshTriggers,
    triggerRefresh,
    triggerAllRefresh,
    triggerAssetRefresh,
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
};
