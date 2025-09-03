import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Avatar,
  useTheme,
  ActivityIndicator,
  Appbar,
  Switch,
  List,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { driver: user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    vehicleType: user?.vehicleType || '',
    vehicleNumber: user?.vehicleNumber || '',
    licenseNumber: user?.licenseNumber || '',
  });

  const theme = useTheme();

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'DR';
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Profile" />
        <Appbar.Action
          icon={editing ? "close" : "pencil"}
          onPress={() => {
            if (editing) {
              setFormData({
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                phone: user?.phone || '',
                vehicleType: user?.vehicleType || '',
                vehicleNumber: user?.vehicleNumber || '',
                licenseNumber: user?.licenseNumber || '',
              });
            }
            setEditing(!editing);
          }}
        />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Avatar.Text
              size={80}
              label={getInitials()}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            />
            <View style={styles.headerInfo}>
              <Title style={styles.name}>
                {user?.firstName} {user?.lastName}
              </Title>
              <Paragraph style={styles.email}>{user?.email}</Paragraph>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: user?.isActive ? '#10b981' : '#ef4444' }
                  ]}
                />
                <Paragraph style={styles.statusText}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Personal Information</Title>
            
            <TextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({...formData, firstName: text})}
              disabled={!editing}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({...formData, lastName: text})}
              disabled={!editing}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              disabled={!editing}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="Email"
              value={user?.email}
              disabled={true}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="lock" />}
            />
          </Card.Content>
        </Card>

        {/* Vehicle Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Vehicle Information</Title>
            
            <TextInput
              label="Vehicle Type"
              value={formData.vehicleType}
              onChangeText={(text) => setFormData({...formData, vehicleType: text})}
              disabled={!editing}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Motorcycle, Car, Truck"
            />
            
            <TextInput
              label="Vehicle Number"
              value={formData.vehicleNumber}
              onChangeText={(text) => setFormData({...formData, vehicleNumber: text})}
              disabled={!editing}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., MH12AB1234"
            />
            
            <TextInput
              label="License Number"
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData({...formData, licenseNumber: text})}
              disabled={!editing}
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Settings</Title>
            
            <List.Item
              title="Push Notifications"
              description="Receive notifications for new orders"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms of service"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Your Stats</Title>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Title style={styles.statValue}>{user?.totalDeliveries || 0}</Title>
                <Paragraph style={styles.statLabel}>Total Deliveries</Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <Title style={styles.statValue}>
                  {user?.rating ? user.rating.toFixed(1) : '0.0'}
                </Title>
                <Paragraph style={styles.statLabel}>Rating</Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <Title style={styles.statValue}>
                  ₹{user?.totalEarnings || 0}
                </Title>
                <Paragraph style={styles.statLabel}>Total Earnings</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {editing && (
            <>
              <Button
                mode="contained"
                onPress={handleUpdate}
                disabled={updating}
                style={styles.updateButton}
                icon="check"
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => {
                  setFormData({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    phone: user?.phone || '',
                    vehicleType: user?.vehicleType || '',
                    vehicleNumber: user?.vehicleNumber || '',
                    licenseNumber: user?.licenseNumber || '',
                  });
                  setEditing(false);
                }}
                style={styles.cancelButton}
                icon="close"
              >
                Cancel
              </Button>
            </>
          )}
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: '#ef4444' }]}
            textColor="#ef4444"
            icon="logout"
          >
            Logout
          </Button>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 20,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    color: '#6b7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  divider: {
    marginVertical: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  updateButton: {
    marginBottom: 10,
    borderRadius: 8,
    paddingVertical: 5,
  },
  cancelButton: {
    marginBottom: 10,
    borderRadius: 8,
    paddingVertical: 5,
  },
  logoutButton: {
    borderRadius: 8,
    paddingVertical: 5,
  },
});

export default ProfileScreen;
