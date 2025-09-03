import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  useTheme,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [loading, setLoading] = useState(false);
  
  const theme = useTheme();
  const { login, register, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Dashboard');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name || !phone || !licenseNumber || !vehicleType) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await register({
      email,
      password,
      name,
      phone,
      licenseNumber,
      vehicle: {
        type: vehicleType,
        make: '',
        model: '',
        plateNumber: '',
        year: new Date().getFullYear(),
      },
    });
    setLoading(false);

    if (result.success) {
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Registration Failed', result.message);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setLicenseNumber('');
    setVehicleType('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="car-sport" size={60} color={theme.colors.primary} />
          <Title style={[styles.title, { color: theme.colors.primary }]}>
            FarmConnect Driver
          </Title>
          <Paragraph style={styles.subtitle}>
            {isRegisterMode ? 'Join our delivery team' : 'Welcome back, driver!'}
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              {isRegisterMode ? 'Create Account' : 'Sign In'}
            </Title>

            {isRegisterMode && (
              <>
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                />
                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                />
                <TextInput
                  label="License Number"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="card-account-details" />}
                />
                <TextInput
                  label="Vehicle Type (e.g., Motorcycle, Car, Truck)"
                  value={vehicleType}
                  onChangeText={setVehicleType}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="car" />}
                />
              </>
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />

            <Button
              mode="contained"
              onPress={isRegisterMode ? handleRegister : handleLogin}
              style={styles.button}
              disabled={loading}
              contentStyle={styles.buttonContent}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                isRegisterMode ? 'Create Account' : 'Sign In'
              )}
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="text"
              onPress={toggleMode}
              style={styles.toggleButton}
            >
              {isRegisterMode
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    color: '#6b7280',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  toggleButton: {
    marginTop: 10,
  },
});

export default LoginScreen;
