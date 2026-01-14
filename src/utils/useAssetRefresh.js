import {useEffect, useRef} from 'react';
import {useDataRefresh} from '../context/DataRefreshContext';

/**
 * Custom hook to handle asset refresh functionality
 * @param {string} dataType - The type of data to refresh ('assets', 'location', 'department', 'search')
 * @param {Function} refreshFunction - The function to call when refresh is triggered
 * @param {Array} dependencies - Additional dependencies for the refresh effect
 */
export const useAssetRefresh = (
  dataType,
  refreshFunction,
  dependencies = [],
) => {
  const {refreshTriggers} = useDataRefresh();
  const lastRefreshRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (
      refreshTriggers[dataType] > 0 &&
      refreshFunction &&
      typeof refreshFunction === 'function' &&
      !isRefreshingRef.current
    ) {
      const now = Date.now();
      if (now - lastRefreshRef.current > 1000) {
        // Prevent refreshes within 1 second
        isRefreshingRef.current = true;
        lastRefreshRef.current = now;

        // Call refresh function
        refreshFunction();

        // Reset refreshing flag after a delay
        setTimeout(() => {
          isRefreshingRef.current = false;
        }, 1000);
      }
    }
  }, [refreshTriggers[dataType], refreshFunction, ...dependencies]);
};

/**
 * Hook specifically for asset list refresh
 * @param {Function} refreshFunction - The function to call when assets are modified
 * @param {Array} dependencies - Additional dependencies for the refresh effect
 */
export const useAssetListRefresh = (refreshFunction, dependencies = []) => {
  useAssetRefresh('assets', refreshFunction, dependencies);
};

/**
 * Hook specifically for location data refresh
 * @param {Function} refreshFunction - The function to call when location data should be refreshed
 * @param {Array} dependencies - Additional dependencies for the refresh effect
 */
export const useLocationRefresh = (refreshFunction, dependencies = []) => {
  useAssetRefresh('location', refreshFunction, dependencies);
};

/**
 * Hook specifically for department data refresh
 * @param {Function} refreshFunction - The function to call when department data should be refreshed
 * @param {Array} dependencies - Additional dependencies for the refresh effect
 */
export const useDepartmentRefresh = (refreshFunction, dependencies = []) => {
  useAssetRefresh('department', refreshFunction, dependencies);
};

/**
 * Hook specifically for search data refresh
 * @param {Function} refreshFunction - The function to call when search data should be refreshed
 * @param {Array} dependencies - Additional dependencies for the refresh effect
 */
export const useSearchRefresh = (refreshFunction, dependencies = []) => {
  useAssetRefresh('search', refreshFunction, dependencies);
};
