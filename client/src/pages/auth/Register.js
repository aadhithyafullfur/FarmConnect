import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'buyer') navigate('/buyer');
      else if (user.role === 'farmer') navigate('/farmer');
    }
  }, [user, navigate]);

  // Test function for manual debugging
  const runDiagnosticTest = async () => {
    console.log('=== DIAGNOSTIC TEST START ===');
    try {
      // Test 1: Basic fetch
      console.log('Test 1: Basic fetch to backend...');
      const fetchResponse = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Diagnostic Test',
          email: 'diagnostic@test.com',
          password: 'test123',
          role: 'buyer'
        })
      });
      console.log('Fetch response status:', fetchResponse.status);
      console.log('Fetch response ok:', fetchResponse.ok);
      const fetchData = await fetchResponse.text();
      console.log('Fetch response data:', fetchData);

      // Test 2: Axios with our api instance
      console.log('Test 2: Axios with API instance...');
      const axiosResponse = await api.post('/auth/register', {
        name: 'Diagnostic Axios',
        email: 'axios@test.com',
        password: 'test123',
        role: 'buyer'
      });
      console.log('Axios response:', axiosResponse.data);
      
    } catch (error) {
      console.error('Diagnostic test error:', error);
    }
    console.log('=== DIAGNOSTIC TEST END ===');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('=== REGISTRATION DEBUG START ===');
    console.log('Frontend: Form data:', { name, email, role, passwordLength: password.length });
    console.log('Frontend: API base URL:', api.defaults.baseURL);
    console.log('Frontend: Current URL:', window.location.href);
    
    try {
      console.log('Frontend: Making API request to /auth/register');
      console.log('Frontend: Request payload:', { name, email, password: '***hidden***', role });
      
      const response = await api.post('/auth/register', { name, email, password, role });
      login(response.data);
      if (response.data.user.role === 'buyer') navigate('/buyer');
      else if (response.data.user.role === 'farmer') navigate('/farmer');    } catch (err) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Frontend: Full error object:', err);
      console.error('Frontend: Error message:', err.message);
      console.error('Frontend: Error code:', err.code);
      console.error('Frontend: Response status:', err.response?.status);
      console.error('Frontend: Response data:', err.response?.data);
      console.error('Frontend: Response headers:', err.response?.headers);
      console.error('Frontend: Request config:', err.config);
      
      let errorMessage = 'Registration failed';
      
      if (err.response && err.response.data) {
        if (err.response.data.msg) {
          errorMessage = err.response.data.msg;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Frontend: Setting error message:', errorMessage);
      setError(errorMessage);
    }
    
    console.log('=== REGISTRATION DEBUG END ===');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-gray-900 to-gray-900"></div>
      <div className="max-w-md w-full space-y-8 bg-gray-800/80 backdrop-blur-xl p-10 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.1)] border border-gray-700/50 relative">
        <div>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-2xl flex items-center justify-center transform rotate-6 shadow-xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-8 text-center text-3xl font-extrabold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
            Join FarmConnect
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Create your account and start connecting
          </p>
        </div>
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-500 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:z-10 sm:text-sm bg-gray-800/90 backdrop-blur-sm transition-all duration-200"
                placeholder="Full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-500 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:z-10 sm:text-sm bg-gray-800/90 backdrop-blur-sm transition-all duration-200"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 placeholder-gray-500 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:z-10 sm:text-sm bg-gray-800/90 backdrop-blur-sm transition-all duration-200"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                I am a
              </label>
              <select
                id="role"
                name="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:z-10 sm:text-sm bg-gray-800/90 backdrop-blur-sm transition-all duration-200"
              >
                <option value="buyer" className="bg-gray-800 text-gray-200">🛒 Buyer - I want to purchase products</option>
                <option value="farmer" className="bg-gray-800 text-gray-200">🌾 Farmer - I want to sell my products</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-gray-900 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all duration-200 shadow-lg shadow-green-900/25 hover:shadow-green-900/40 transform hover:scale-[1.02]"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-900 group-hover:text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </span>
              Create Account
            </button>
            
            <button
              type="button"
              onClick={runDiagnosticTest}
              className="w-full flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-xl text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
            >
              🔧 Run Diagnostic Test (Check Console)
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-green-400 hover:text-green-300 transition-colors duration-200">
                Sign in here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;