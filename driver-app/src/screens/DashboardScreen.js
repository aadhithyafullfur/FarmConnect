import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Switch,
  Chip,
  FAB,
  Badge,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { orderAPI, locationAPI } from '../services/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const theme = useTheme();
  const { driver, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, earningsResponse] = await Promise.all([
        orderAPI.getOrders(),
        orderAPI.getEarnings(),
      ]);
      
      setOrders(ordersResponse.data.orders || []);
      setEarnings(earningsResponse.data.earnings || { today: 0, week: 0, month: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      await locationAPI.toggleAvailability(newAvailability);
      setIsAvailable(newAvailability);
      
      Alert.alert(
        'Status Updated',
        `You are now ${newAvailability ? 'available' : 'unavailable'} for deliveries`
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await orderAPI.acceptOrder(orderId);
      Alert.alert('Success', 'Order accepted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order');
    }
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>Loading dashboard...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Title style={styles.greeting}>
              Hello, {driver?.name || 'Driver'}!
            </Title>
            <Paragraph style={styles.subtitle}>
              Ready to make some deliveries?
            </Paragraph>
          </View>
          <Button
            mode="text"
            icon="logout"
            onPress={logout}
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </View>

        {/* Availability Toggle */}
        <Card style={styles.card}>
          <Card.Content style={styles.availabilityCard}>
            <View style={styles.availabilityInfo}>
              <Ionicons
                name={isAvailable ? "checkmark-circle" : "close-circle"}
                size={24}
                color={isAvailable ? theme.colors.success : theme.colors.error}
              />
              <Title style={styles.availabilityTitle}>
                {isAvailable ? 'Online' : 'Offline'}
              </Title>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              color={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        {/* Earnings Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Today's Earnings</Title>
            <View style={styles.earningsGrid}>
              <View style={styles.earningItem}>
                <Paragraph style={styles.earningLabel}>Today</Paragraph>
                <Title style={[styles.earningAmount, { color: theme.colors.primary }]}>
                  ₹{earnings.today}
                </Title>
              </View>
              <View style={styles.earningItem}>
                <Paragraph style={styles.earningLabel}>This Week</Paragraph>
                <Title style={[styles.earningAmount, { color: theme.colors.secondary }]}>
                  ₹{earnings.week}
                </Title>
              </View>
              <View style={styles.earningItem}>
                <Paragraph style={styles.earningLabel}>This Month</Paragraph>
                <Title style={[styles.earningAmount, { color: theme.colors.accent }]}>
                  ₹{earnings.month}
                </Title>
              </View>
              <View style={styles.earningItem}>
                <Paragraph style={styles.earningLabel}>Total</Paragraph>
                <Title style={[styles.earningAmount, { color: theme.colors.primary }]}>
                  ₹{earnings.total}
                </Title>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Orders Section */}
        <View style={styles.ordersHeader}>
          <Title style={styles.sectionTitle}>
            Orders ({orders.length})
          </Title>
          {orders.length > 0 && (
            <Badge style={styles.ordersBadge}>{orders.length}</Badge>
          )}
        </View>

        {orders.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={theme.colors.disabled} />
              <Paragraph style={styles.emptyStateText}>
                {isAvailable
                  ? "No orders available at the moment"
                  : "Go online to receive orders"}
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order._id} style={styles.orderCard}>
              <Card.Content>
                <View style={styles.orderHeader}>
                  <Title style={styles.orderTitle}>
                    Order #{order.orderNumber || order._id.slice(-6)}
                  </Title>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(order.status)}
                  </Chip>
                </View>
                
                <View style={styles.orderDetails}>
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                    <Paragraph style={styles.orderDetailText}>
                      {order.pickupAddress || 'Pickup address not available'}
                    </Paragraph>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="navigate-outline" size={16} color={theme.colors.secondary} />
                    <Paragraph style={styles.orderDetailText}>
                      {order.deliveryAddress || order.shippingAddress || 'Delivery address not available'}
                    </Paragraph>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors.success} />
                    <Paragraph style={styles.orderDetailText}>
                      Delivery Fee: ₹{order.deliveryFee || 50}
                    </Paragraph>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  {order.status === 'pending' && (
                    <Button
                      mode="contained"
                      onPress={() => handleAcceptOrder(order._id)}
                      style={styles.acceptButton}
                      icon="check"
                    >
                      Accept Order
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
                    style={styles.detailsButton}
                    icon="eye"
                  >
                    View Details
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="map"
        onPress={() => navigation.navigate('Map')}
        color="white"
      />
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 5,
  },
  logoutButton: {
    marginTop: 10,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  availabilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityTitle: {
    marginLeft: 10,
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earningItem: {
    width: width * 0.4,
    alignItems: 'center',
    marginBottom: 15,
  },
  earningLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  earningAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  ordersBadge: {
    backgroundColor: '#22c55e',
  },
  orderCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusChip: {
    borderRadius: 20,
  },
  orderDetails: {
    marginBottom: 15,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetailText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 1,
    marginRight: 10,
  },
  detailsButton: {
    flex: 1,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#22c55e',
  },
});

export default DashboardScreen;
