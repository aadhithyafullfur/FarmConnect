import React, { createContext, useState, useEffect, useContext } from 'react';

const DriverContext = createContext();

export function DriverProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    const storedDriver = localStorage.getItem('driver');
    if (token && storedDriver) {
      setDriver(JSON.parse(storedDriver));
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('driverToken', data.token);
    localStorage.setItem('driver', JSON.stringify(data.driver));
    setDriver(data.driver);
  };

  const logout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driver');
    setDriver(null);
  };

  const updateDriver = (updatedDriver) => {
    localStorage.setItem('driver', JSON.stringify(updatedDriver));
    setDriver(updatedDriver);
  };

  const value = {
    driver,
    login,
    logout,
    updateDriver,
    loading
  };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
}

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};

export default DriverContext;
