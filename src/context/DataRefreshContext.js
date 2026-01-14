import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

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

  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Trigger refresh for specific data types with debouncing
  const triggerRefresh = useCallback(dataType => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshTriggers(prev => ({
        ...prev,
        [dataType]: prev[dataType] + 1,
      }));
    }, 100); // 100ms debounce
  }, []);

  // Trigger refresh for all data types with controlled timing
  const triggerAllRefresh = useCallback(() => {
    if (isRefreshingRef.current) {
      return; // Prevent concurrent refreshes
    }

    isRefreshingRef.current = true;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshTriggers(prev => ({
        assets: prev.assets + 1,
        location: prev.location + 1,
        department: prev.department + 1,
        search: prev.search + 1,
      }));

      // Reset the refreshing flag after a delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 500);
    }, 200); // 200ms debounce for all refreshes
  }, []);

  // Trigger refresh for asset-related operations with controlled timing
  const triggerAssetRefresh = useCallback(() => {
    if (isRefreshingRef.current) {
      return; // Prevent concurrent refreshes
    }

    isRefreshingRef.current = true;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshTriggers(prev => ({
        assets: prev.assets + 1,
        location: prev.location + 1,
        department: prev.department + 1,
        search: prev.search + 1,
      }));

      // Reset the refreshing flag after a delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 500);
    }, 300); // 300ms debounce for asset refreshes
  }, []);

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
