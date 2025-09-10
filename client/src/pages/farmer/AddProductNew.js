import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CropSelector from '../../components/CropSelector';

function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'vegetable',
    price: '',
    unit: 'kg',
    quantity: '',
    minimumOrder: '1',
    organicCertified: false,
    freshnessPeriod: '',
    harvestDate: '',
    farmLocation: '',
    farmingMethod: 'traditional',
    deliveryOptions: {
      homeDelivery: false,
      pickupFromFarm: false,
      marketDelivery: false
    },
    deliveryRadius: '10',
    shippingCost: '0',
    image: null,
    selectedCrop: null,
    cropType: null,
    status: 'available'
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'vegetable', label: '🥬 Vegetables', emoji: '🥬' },
    { value: 'fruit', label: '🍎 Fruits', emoji: '🍎' },
    { value: 'grain', label: '🌾 Grains', emoji: '🌾' },
    { value: 'dairy', label: '🥛 Dairy', emoji: '🥛' },
    { value: 'herbs', label: '🌿 Herbs', emoji: '🌿' },
    { value: 'nuts', label: '🥜 Nuts', emoji: '🥜' },
    { value: 'other', label: '📦 Other', emoji: '📦' }
  ];

  const units = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'piece', label: 'Piece' },
    { value: 'bunch', label: 'Bunch' },
    { value: 'liter', label: 'Liter' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'bag', label: 'Bag' }
  ];

  const farmingMethods = [
    { value: 'traditional', label: '🌱 Traditional' },
    { value: 'organic', label: '🌿 Organic' },
    { value: 'hydroponic', label: '💧 Hydroponic' },
    { value: 'greenhouse', label: '🏠 Greenhouse' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear error
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleCropSelect = (crop) => {
    setFormData(prev => ({
      ...prev,
      selectedCrop: crop,
      cropType: crop.id,
      name: crop.name, // Auto-fill product name
      image: null // Clear any uploaded image
    }));
    setImagePreview(null);
  };

  const toggleImageMode = () => {
    setUseCustomImage(!useCustomImage);
    if (!useCustomImage) {
      // Switching to custom image mode
      setFormData(prev => ({
        ...prev,
        selectedCrop: null,
        cropType: null
      }));
    } else {
      // Switching to crop selection mode
      setFormData(prev => ({
        ...prev,
        image: null
      }));
      setImagePreview(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.farmLocation.trim()) newErrors.farmLocation = 'Farm location is required';
    
    // Check if at least one delivery option is selected
    const hasDeliveryOption = Object.values(formData.deliveryOptions).some(option => option);
    if (!hasDeliveryOption) {
      newErrors.deliveryOptions = 'Please select at least one delivery option';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'deliveryOptions') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'image' && formData[key] && useCustomImage) {
          submitData.append(key, formData[key]);
        } else if (key === 'selectedCrop') {
          // Don't append the selectedCrop object
          return;
        } else if (key === 'cropType' && formData.selectedCrop && !useCustomImage) {
          submitData.append(key, formData.cropType);
          submitData.append('useDefaultImage', 'true');
        } else if (key !== 'image') {
          submitData.append(key, formData[key]);
        }
      });
      
      const response = await api.post('/products', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Product created:', response.data);
      alert('Product added successfully!');
      navigate('/farmer');
      
    } catch (err) {
      console.error('Error creating product:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to add product';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-4">
            Add New Product
          </h1>
          <p className="text-gray-400 text-lg">List your fresh produce for buyers</p>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-green-400 mx-auto mt-4 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3">📝</span>
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Fresh Tomatoes"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe your product, its quality, taste, etc."
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Pricing & Quantity */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3">💰</span>
              Pricing & Quantity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Price per Unit (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Available Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
                {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Minimum Order
                </label>
                <input
                  type="number"
                  name="minimumOrder"
                  value={formData.minimumOrder}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Farm Information */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3">🚜</span>
              Farm Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Farm Location *
                </label>
                <input
                  type="text"
                  name="farmLocation"
                  value={formData.farmLocation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Village Name, District"
                />
                {errors.farmLocation && <p className="text-red-400 text-sm mt-1">{errors.farmLocation}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Farming Method
                </label>
                <select
                  name="farmingMethod"
                  value={formData.farmingMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {farmingMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Harvest Date
                </label>
                <input
                  type="date"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Freshness Period (days)
                </label>
                <input
                  type="number"
                  name="freshnessPeriod"
                  value={formData.freshnessPeriod}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 7"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="organicCertified"
                    checked={formData.organicCertified}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-gray-300">🌿 Organic Certified</span>
                </label>
              </div>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3">🚚</span>
              Delivery Options
            </h2>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="deliveryOptions.homeDelivery"
                  checked={formData.deliveryOptions.homeDelivery}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-gray-300">🏠 Home Delivery</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="deliveryOptions.pickupFromFarm"
                  checked={formData.deliveryOptions.pickupFromFarm}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-gray-300">🚜 Pickup from Farm</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="deliveryOptions.marketDelivery"
                  checked={formData.deliveryOptions.marketDelivery}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-gray-300">🏪 Market Delivery</span>
              </label>
            </div>
            
            {errors.deliveryOptions && <p className="text-red-400 text-sm mb-4">{errors.deliveryOptions}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Delivery Radius (km)
                </label>
                <input
                  type="number"
                  name="deliveryRadius"
                  value={formData.deliveryRadius}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Shipping Cost (₹)
                </label>
                <input
                  type="number"
                  name="shippingCost"
                  value={formData.shippingCost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <span className="mr-3">📸</span>
                Product Image
              </h2>
              <button
                type="button"
                onClick={toggleImageMode}
                className="text-sm text-green-400 hover:text-green-300 font-medium px-3 py-1 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors"
              >
                {useCustomImage ? 'Use Crop Selection' : 'Upload Custom Image'}
              </button>
            </div>
            
            {!useCustomImage ? (
              // Crop Selection Mode
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                  <h3 className="text-gray-300 font-medium mb-3">Select Your Crop</h3>
                  <CropSelector
                    onCropSelect={handleCropSelect}
                    selectedCrop={formData.selectedCrop}
                    category={formData.category}
                  />
                </div>
                {formData.selectedCrop && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{formData.selectedCrop.emoji}</span>
                      <div>
                        <p className="text-green-400 font-medium">Selected: {formData.selectedCrop.name}</p>
                        <p className="text-gray-400 text-sm">Default image will be used automatically</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Custom Image Upload Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Upload Image (Max 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-600"
                  />
                  {errors.image && <p className="text-red-400 text-sm mt-1">{errors.image}</p>}
                </div>
                
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-gray-300 text-sm mb-2">Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-64 h-48 object-cover rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/farmer')}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
              <span>{loading ? 'Adding Product...' : 'Add Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
