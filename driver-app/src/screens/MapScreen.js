import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  useTheme,
  ActivityIndicator,
  Appbar,
  Portal,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation, route }) => {
  const { order } = route.params || {};
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [showOrderCard, setShowOrderCard] = useState(true);
  
  const mapRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your current location'
        );
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    try {
      setTracking(true);
      
      // Start watching position
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setCurrentLocation(newLocation);
          
          // Center map on current location
          if (mapRef.current) {
            mapRef.current.animateToRegion(newLocation, 1000);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
      setTracking(false);
    }
  };

  const stopTracking = () => {
    setTracking(false);
    // Note: In a real app, you'd store the watch subscription and clear it here
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(currentLocation, 1000);
    }
  };

  const getPickupCoordinates = () => {
    // In a real app, you'd geocode the pickup address
    // For demo purposes, using a fixed location
    return {
      latitude: currentLocation ? currentLocation.latitude + 0.01 : 0,
      longitude: currentLocation ? currentLocation.longitude + 0.01 : 0,
    };
  };

  const getDeliveryCoordinates = () => {
    // In a real app, you'd geocode the delivery address
    // For demo purposes, using a fixed location
    return {
      latitude: currentLocation ? currentLocation.latitude - 0.01 : 0,
      longitude: currentLocation ? currentLocation.longitude - 0.01 : 0,
    };
  };

  const showAllMarkers = () => {
    if (!currentLocation || !mapRef.current) return;

    const coordinates = [
      currentLocation,
      getPickupCoordinates(),
      getDeliveryCoordinates(),
    ];

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
      animated: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Order Map" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Paragraph style={styles.loadingText}>Getting your location...</Paragraph>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Order Map" />
        <Appbar.Action
          icon="map-marker"
          onPress={showAllMarkers}
          disabled={!currentLocation}
        />
      </Appbar.Header>

      {currentLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={currentLocation}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsTraffic={true}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          >
            <View style={styles.currentLocationMarker}>
              <Ionicons name="location" size={24} color="white" />
            </View>
          </Marker>

          {/* Pickup Location Marker */}
          {order && (
            <Marker
              coordinate={getPickupCoordinates()}
              title="Pickup Location"
              description={order.pickupAddress || "Pickup Address"}
              pinColor="green"
            >
              <View style={styles.pickupMarker}>
                <Ionicons name="storefront" size={24} color="white" />
              </View>
            </Marker>
          )}

          {/* Delivery Location Marker */}
          {order && (
            <Marker
              coordinate={getDeliveryCoordinates()}
              title="Delivery Location"
              description={order.deliveryAddress || order.shippingAddress || "Delivery Address"}
              pinColor="red"
            >
              <View style={styles.deliveryMarker}>
                <Ionicons name="home" size={24} color="white" />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.errorContainer}>
          <Paragraph>Unable to load map. Please check location permissions.</Paragraph>
          <Button
            mode="contained"
            onPress={getCurrentLocation}
            style={styles.retryButton}
          >
            Try Again
          </Button>
        </View>
      )}

      {/* Order Information Card */}
      {order && showOrderCard && (
        <Portal>
          <Card style={styles.orderCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>
                  Order #{order.orderNumber || order._id?.slice(-6)}
                </Title>
                <Button
                  mode="text"
                  onPress={() => setShowOrderCard(false)}
                  icon="close"
                  compact
                >
                  Hide
                </Button>
              </View>
              
              <View style={styles.addressContainer}>
                <View style={styles.addressRow}>
                  <View style={[styles.addressDot, { backgroundColor: '#10b981' }]} />
                  <View style={styles.addressInfo}>
                    <Paragraph style={styles.addressLabel}>Pickup</Paragraph>
                    <Paragraph style={styles.addressText}>
                      {order.pickupAddress || 'Pickup address not available'}
                    </Paragraph>
                  </View>
                </View>
                
                <View style={styles.addressLine} />
                
                <View style={styles.addressRow}>
                  <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
                  <View style={styles.addressInfo}>
                    <Paragraph style={styles.addressLabel}>Delivery</Paragraph>
                    <Paragraph style={styles.addressText}>
                      {order.deliveryAddress || order.shippingAddress || 'Delivery address not available'}
                    </Paragraph>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
                  style={styles.detailsButton}
                  icon="information"
                >
                  Details
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Portal>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon="crosshairs-gps"
          onPress={centerOnCurrentLocation}
          style={[styles.fab, styles.locationFab]}
          size="small"
        />
        
        <FAB
          icon={tracking ? "pause" : "play"}
          onPress={tracking ? stopTracking : startTracking}
          style={[
            styles.fab,
            styles.trackingFab,
            { backgroundColor: tracking ? '#ef4444' : theme.colors.primary }
          ]}
          size="small"
        />
        
        {!showOrderCard && order && (
          <FAB
            icon="information"
            onPress={() => setShowOrderCard(true)}
            style={[styles.fab, styles.infoFab]}
            size="small"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 20,
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryMarker: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    elevation: 8,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressContainer: {
    marginBottom: 15,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 12,
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginLeft: 5,
    marginVertical: 5,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  detailsButton: {
    borderRadius: 20,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    marginBottom: 10,
    elevation: 6,
  },
  locationFab: {
    backgroundColor: '#6b7280',
  },
  trackingFab: {
    // backgroundColor set dynamically
  },
  infoFab: {
    backgroundColor: '#3b82f6',
  },
});

export default MapScreen;
