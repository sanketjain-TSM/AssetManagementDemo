# Chorus Asset Management CLI

A React Native CLI application for asset management.

## Getting Started

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS, install CocoaPods:
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Start Metro Bundler
```bash
npm start
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React Context providers
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── shared/         # Shared utilities and constants
└── utils/          # Utility functions
```

## Dependencies

This project uses the same dependencies as the original Expo project, but configured for React Native CLI. 