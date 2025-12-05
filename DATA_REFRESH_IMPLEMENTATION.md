# Data Refresh Implementation

This document describes the implementation of automatic data refresh functionality when assets are created, updated, or deleted in the Chorus Asset Management application.

## Overview

The application now automatically refreshes data across all relevant screens whenever an asset is created, updated, or deleted. This ensures that users always see the most up-to-date information without manually refreshing screens.

## Architecture

### 1. DataRefreshContext (`src/context/DataRefreshContext.js`)

A React Context that manages refresh triggers for different types of data:

- **assets**: Triggers refresh for asset lists
- **location**: Triggers refresh for location-based data
- **department**: Triggers refresh for department-specific data
- **search**: Triggers refresh for search results

### 2. Custom Hooks (`src/utils/useAssetRefresh.js`)

Specialized hooks for different types of data refresh:

- `useAssetListRefresh()`: For asset list screens
- `useLocationRefresh()`: For location-based screens
- `useDepartmentRefresh()`: For department-specific screens
- `useSearchRefresh()`: For search functionality

## Implementation Details

### Trigger Points

Data refresh is triggered automatically when:

1. **Asset Creation**: When a new asset is successfully created via `AddAssetScreen`
2. **Asset Update**: When an existing asset is successfully updated via `AddAssetScreen` (edit mode)
3. **Asset Deletion**: When an asset is successfully deleted from `AssetDetailsScreen` or `DepartmentAssetDetailsScreen`

### Affected Screens

The following screens automatically refresh their data when assets are modified:

1. **AssetsScreen**: Refreshes the main assets list
2. **LocationScreen**: Refreshes floor and department data
3. **DepartmentListScreen**: Refreshes department-specific asset data
4. **HomeScreen**: Refreshes search results if a search is active
5. **SearchScreen**: Refreshes search results if a search is active

### API Calls Refreshed

The following API endpoints are automatically called when refresh is triggered:

- `GET /v1/assets/assetsList` - Main assets list
- `GET /v1/assets/floor/{floor}` - Floor data
- `GET /v1/assets/floor/{floor}/{department}/{zoneId}` - Department data
- `POST /v1/assets/search` - Search results

## Usage Examples

### For Asset Lists

```javascript
import { useAssetListRefresh } from '../utils/useAssetRefresh';

const AssetsScreen = () => {
  const fetchAssets = async () => {
    // Fetch assets logic
  };

  // Automatically refreshes when assets are modified
  useAssetListRefresh(fetchAssets);

  return (
    // Component JSX
  );
};
```

### For Location Data

```javascript
import { useLocationRefresh } from '../utils/useAssetRefresh';

const LocationScreen = () => {
  const fetchFloorData = async (floor) => {
    // Fetch floor data logic
  };

  // Automatically refreshes when assets are modified
  useLocationRefresh(() => {
    if (selectedFloor) {
      fetchFloorData(selectedFloor);
    }
  }, [selectedFloor]);

  return (
    // Component JSX
  );
};
```

### For Department Data

```javascript
import { useDepartmentRefresh } from '../utils/useAssetRefresh';

const DepartmentListScreen = () => {
  const refreshDepartmentData = async () => {
    // Refresh department data logic
  };

  // Automatically refreshes when assets are modified
  useDepartmentRefresh(refreshDepartmentData);

  return (
    // Component JSX
  );
};
```

### For Search Results

```javascript
import { useSearchRefresh } from '../utils/useAssetRefresh';

const SearchScreen = () => {
  const handleSearch = async (query) => {
    // Search logic
  };

  // Automatically refreshes when assets are modified
  useSearchRefresh(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  return (
    // Component JSX
  );
};
```

## Benefits

1. **Real-time Updates**: Users see changes immediately without manual refresh
2. **Consistent Data**: All screens show synchronized information
3. **Better UX**: No need for users to manually refresh screens
4. **Maintainable**: Centralized refresh logic with reusable hooks
5. **Performance**: Only refreshes when necessary, not on every render

## Technical Notes

- The refresh system uses React Context to avoid prop drilling
- Custom hooks provide a clean API for different types of refresh
- Refresh triggers are incremental counters to ensure updates are detected
- The system is designed to be efficient and only refresh when assets are actually modified
- All refresh operations are asynchronous and handle errors gracefully

## Future Enhancements

Potential improvements for the refresh system:

1. **Selective Refresh**: Only refresh specific data types instead of all
2. **Optimistic Updates**: Update UI immediately, then sync with server
3. **Refresh Indicators**: Show loading states during refresh operations
4. **Offline Support**: Queue refresh operations when offline
5. **Refresh History**: Track what was refreshed for debugging purposes
