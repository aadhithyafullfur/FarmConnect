# FarmConnect Driver App

A React Native mobile application for delivery drivers in the FarmConnect ecosystem. This app allows drivers to manage deliveries, track orders, and handle the delivery process efficiently.

## Features

- **Driver Authentication**: Secure login and registration for drivers
- **Order Management**: View, accept, and manage delivery orders
- **Real-time Tracking**: GPS-based location tracking and navigation
- **Order Status Updates**: Update order status throughout the delivery process
- **Earnings Tracking**: Track daily and total earnings
- **Profile Management**: Manage driver profile and vehicle information
- **Interactive Maps**: Integrated maps for pickup and delivery locations

## Prerequisites

Before running the app, ensure you have the following installed:

- **Node.js** (version 16 or later)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## Installation

1. **Navigate to the driver app directory:**
   ```bash
   cd driver-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Expo CLI (if not already installed):**
   ```bash
   npm install -g @expo/cli
   ```

## Configuration

### 1. API Configuration

Edit `src/services/api.js` and update the base URL to match your server:

```javascript
const API_BASE_URL = 'http://your-server-url:5000/api';
```

### 2. Google Maps Configuration (Optional)

If you want to use Google Maps instead of the default map provider:

1. Get a Google Maps API key from the Google Cloud Console
2. Add it to your `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

## Running the App

### Development Mode

1. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

2. **Run on different platforms:**
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

### Building for Production

1. **Configure app signing:**
   ```bash
   npx expo configure
   ```

2. **Build for Android:**
   ```bash
   npx expo build:android
   ```

3. **Build for iOS:**
   ```bash
   npx expo build:ios
   ```

## Project Structure

```
driver-app/
├── App.js                 # Main app component with navigation
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
└── src/
    ├── components/       # Reusable components
    ├── context/         # React Context providers
    │   └── AuthContext.js
    ├── screens/         # App screens
    │   ├── DashboardScreen.js
    │   ├── LoginScreen.js
    │   ├── MapScreen.js
    │   ├── OrderDetailsScreen.js
    │   └── ProfileScreen.js
    ├── services/        # API and external services
    │   └── api.js
    └── theme/          # App theme and styling
        └── theme.js
```

## Backend Integration

### Required API Endpoints

The app expects the following API endpoints to be available:

#### Authentication
- `POST /auth/driver/login` - Driver login
- `POST /auth/driver/register` - Driver registration
- `GET /auth/driver/profile` - Get driver profile
- `PUT /auth/driver/profile` - Update driver profile

#### Orders
- `GET /orders/driver` - Get orders assigned to driver
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/accept` - Accept an order
- `PUT /orders/:id/status` - Update order status

### Sample Backend Routes

Make sure your server has routes similar to:

```javascript
// In your server routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
API_URL=http://localhost:5000/api
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Permissions

The app requires the following permissions:

- **Location Access**: For GPS tracking and navigation
- **Network Access**: For API communication
- **Notifications**: For order alerts (optional)

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **Node modules issues:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS Simulator not starting:**
   - Make sure Xcode is properly installed
   - Try: `npx expo run:ios`

4. **Android emulator issues:**
   - Make sure Android Studio is properly configured
   - Try: `npx expo run:android`

### Location Services

If location services aren't working:

1. Check device/simulator location permissions
2. Ensure location services are enabled on the device
3. For iOS simulator: Features > Location > Custom Location

## Development Tips

1. **Hot Reloading**: The app supports hot reloading during development
2. **Debugging**: Use React Native Debugger or Expo DevTools
3. **Testing**: Test on both Android and iOS devices/simulators
4. **Performance**: Use React DevTools for performance monitoring

## Deployment

### Android Play Store

1. Build a signed APK:
   ```bash
   npx expo build:android -t apk
   ```

2. Upload to Google Play Console

### iOS App Store

1. Build for iOS:
   ```bash
   npx expo build:ios
   ```

2. Upload to App Store Connect using Application Loader

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the documentation
- Review the troubleshooting section
- Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.
