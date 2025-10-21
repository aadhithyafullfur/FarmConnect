import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from '../../components/ChatInterface';
import ChatStarter from '../../components/ChatStarter';
import axios from 'axios';

const ChatTest = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.filter(user => user._id !== currentUser?._id));
    } catch (err) {
      console.error('Error fetching users:', err);
      // For demo purposes, create some dummy users if API fails
      setUsers([
        { _id: '1', name: 'John Farmer', role: 'farmer' },
        { _id: '2', name: 'Sarah Buyer', role: 'buyer' },
        { _id: '3', name: 'Mike Producer', role: 'farmer' }
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Get current user
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ _id: payload.userId, name: payload.name || 'Current User' });
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }

    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Chat System Demo</h1>
          
          {currentUser && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Welcome, {currentUser.name}!</h2>
              <p className="text-gray-600">
                You can now start chatting with other users on the platform. Use the floating chat button 
                or click on any user below to start a conversation.
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Users to Chat With</h2>
            
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No other users found.</p>
                <p className="text-sm mt-2">Make sure you're logged in and there are other users registered.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <div key={user._id} className="border rounded-lg p-4 hover:shadow-md transition duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{user.role || 'User'}</p>
                      </div>
                    </div>
                    <ChatStarter
                      userId={user._id}
                      userName={user.name}
                      buttonText="Start Chat"
                      className="w-full justify-center"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Chat Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Real-time messaging with other users</li>
              <li>• Message history and conversation threads</li>
              <li>• Unread message notifications</li>
              <li>• Clean and professional UI</li>
              <li>• Mobile-friendly chat interface</li>
              <li>• Floating chat button for easy access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Chat Interface */}
      <ChatInterface />
    </div>
  );
};

export default ChatTest;