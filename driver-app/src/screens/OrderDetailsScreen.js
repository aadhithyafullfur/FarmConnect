import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  useTheme,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../services/api';

const OrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const theme = useTheme();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderAPI.getOrderDetails(orderId);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status) => {
    try {
      setUpdating(true);
      await orderAPI.updateOrderStatus(orderId, status);
      
      Alert.alert('Success', `Order status updated to ${status}`);
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const acceptOrder = async () => {
    try {
      setUpdating(true);
      await orderAPI.acceptOrder(orderId);
      
      Alert.alert('Success', 'Order accepted successfully');
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order');
    } finally {
      setUpdating(false);
    }
  };

  const openMaps = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'in_transit': return '#8b5cf6';
      case 'delivered': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'New Order';
      case 'accepted': return 'Accepted';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Order Details" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Paragraph style={styles.loadingText}>Loading order details...</Paragraph>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Order Details" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Paragraph>Order not found</Paragraph>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`Order #${order.orderNumber || order._id.slice(-6)}`} />
        <Appbar.Action
          icon="map"
          onPress={() => navigation.navigate('Map', { order })}
        />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {/* Order Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Title>Order Status</Title>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                textStyle={{ color: 'white' }}
              >
                {getStatusText(order.status)}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Customer Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Customer Information</Title>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
              <Paragraph style={styles.infoText}>
                {order.buyerId?.firstName} {order.buyerId?.lastName}
              </Paragraph>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
              <Paragraph style={styles.infoText}>
                {order.buyerId?.phone || 'Phone not available'}
              </Paragraph>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={theme.colors.primary} />
              <Paragraph style={styles.infoText}>
                {order.buyerId?.email}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Pickup Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.addressHeader}>
              <Title style={styles.sectionTitle}>Pickup Location</Title>
              <Button
                mode="outlined"
                icon="map"
                onPress={() => openMaps(order.pickupAddress)}
                style={styles.mapButton}
              >
                Open Maps
              </Button>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={theme.colors.secondary} />
              <Paragraph style={styles.infoText}>
                {order.pickupAddress || 'Pickup address not available'}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Delivery Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.addressHeader}>
              <Title style={styles.sectionTitle}>Delivery Location</Title>
              <Button
                mode="outlined"
                icon="map"
                onPress={() => openMaps(order.deliveryAddress || order.shippingAddress)}
                style={styles.mapButton}
              >
                Open Maps
              </Button>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color={theme.colors.accent} />
              <Paragraph style={styles.infoText}>
                {order.deliveryAddress || order.shippingAddress || 'Delivery address not available'}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Order Items */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Order Items</Title>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Paragraph style={styles.itemName}>
                      {item.productId?.name || 'Product name not available'}
                    </Paragraph>
                    <Paragraph style={styles.itemDetails}>
                      Quantity: {item.quantity} • Price: ₹{item.price}
                    </Paragraph>
                  </View>
                  <Paragraph style={styles.itemTotal}>
                    ₹{item.quantity * item.price}
                  </Paragraph>
                </View>
              ))
            ) : (
              <Paragraph>No items information available</Paragraph>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Paragraph style={styles.totalLabel}>Delivery Fee:</Paragraph>
              <Paragraph style={styles.totalAmount}>₹{order.deliveryFee || 50}</Paragraph>
            </View>
            <View style={styles.totalRow}>
              <Title style={styles.totalLabel}>Total Amount:</Title>
              <Title style={styles.totalAmount}>₹{order.totalAmount || 0}</Title>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {order.status === 'pending' && (
            <Button
              mode="contained"
              onPress={acceptOrder}
              style={styles.actionButton}
              disabled={updating}
              icon="check"
            >
              {updating ? 'Accepting...' : 'Accept Order'}
            </Button>
          )}
          
          {order.status === 'accepted' && (
            <Button
              mode="contained"
              onPress={() => updateOrderStatus('in_transit')}
              style={styles.actionButton}
              disabled={updating}
              icon="truck"
            >
              {updating ? 'Updating...' : 'Start Delivery'}
            </Button>
          )}
          
          {order.status === 'in_transit' && (
            <Button
              mode="contained"
              onPress={() => updateOrderStatus('delivered')}
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              disabled={updating}
              icon="check-circle"
            >
              {updating ? 'Updating...' : 'Mark as Delivered'}
            </Button>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mapButton: {
    borderRadius: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemDetails: {
    color: '#6b7280',
    fontSize: 14,
  },
  itemTotal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  actionButton: {
    marginBottom: 10,
    borderRadius: 8,
    paddingVertical: 5,
  },
});

export default OrderDetailsScreen;
