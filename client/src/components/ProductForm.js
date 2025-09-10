import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import CropSelector from './CropSelector';

function ProductForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    category: initialData?.category || 'vegetable',
    quantity: initialData?.quantity || '',
    unit: initialData?.unit || 'kg',
    expirationDate: initialData?.expirationDate 
      ? new Date(initialData.expirationDate).toISOString().split('T')[0] 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
    image: null,
    selectedCrop: null,
    cropType: initialData?.cropType || null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(initialData?.imageUrl || null);
  const [touched, setTouched] = useState({});
  const [useCustomImage, setUseCustomImage] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.[0]) {
      const file = acceptedFiles[0];
      setFormData(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleCropSelect = (crop) => {
    setFormData(prev => ({
      ...prev,
      selectedCrop: crop,
      cropType: crop.id,
      name: crop.name, // Auto-fill product name with crop name
      image: null // Clear any uploaded image
    }));
    setPreview(null);
    setUseCustomImage(false);
  };

  const toggleImageMode = () => {
    setUseCustomImage(!useCustomImage);
    if (!useCustomImage) {
      // Switching to custom image, clear crop selection
      setFormData(prev => ({
        ...prev,
        selectedCrop: null,
        cropType: null
      }));
    } else {
      // Switching to crop selection, clear uploaded image
      setFormData(prev => ({
        ...prev,
        image: null
      }));
      setPreview(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.description) errors.description = 'Description is required';
    if (!formData.price) errors.price = 'Price is required';
    if (formData.price <= 0) errors.price = 'Price must be greater than 0';
    if (!formData.quantity) errors.quantity = 'Quantity is required';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (!formData.expirationDate) errors.expirationDate = 'Expiration date is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setError('Please fill in all required fields correctly');
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSubmit = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity)
      };
      
      // If using crop selection, include crop information
      if (formData.selectedCrop && !useCustomImage) {
        dataToSubmit.cropType = formData.selectedCrop.id;
        dataToSubmit.useDefaultImage = true;
        delete dataToSubmit.image; // Don't send image file
        await onSubmit(dataToSubmit);
      } else if (formData.image) {
        // Using custom image upload
        const formDataToSend = new FormData();
        Object.keys(dataToSubmit).forEach(key => {
          if (key !== 'selectedCrop') { // Don't send selectedCrop object
            formDataToSend.append(key, dataToSubmit[key]);
          }
        });
        await onSubmit(formDataToSend);
      } else {
        // No image selected
        delete dataToSubmit.image;
        delete dataToSubmit.selectedCrop;
        await onSubmit(dataToSubmit);
      }

      // Reset form after successful submission
      if (!initialData) {
        setFormData({
          name: '',
          description: '',
          price: '',
          category: 'vegetable',
          quantity: '',
          unit: 'kg',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          image: null,
          selectedCrop: null,
          cropType: null
        });
        setPreview(null);
        setUseCustomImage(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          {initialData ? 'Update Product' : 'Add New Product'}
        </h2>
        <p className="text-gray-600 mt-2">Fill in the details below to list your product</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                touched.name && !formData.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
            />
            {touched.name && !formData.name && (
              <p className="mt-1 text-sm text-red-500">Product name is required</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="4"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                touched.description && !formData.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your product"
            />
            {touched.description && !formData.description && (
              <p className="mt-1 text-sm text-red-500">Description is required</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Price (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                onBlur={handleBlur}
                min="0"
                step="0.01"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  touched.price && (!formData.price || formData.price <= 0) ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {touched.price && (!formData.price || formData.price <= 0) && (
                <p className="mt-1 text-sm text-red-500">Enter a valid price</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="vegetable">Vegetable</option>
                <option value="fruit">Fruit</option>
                <option value="grain">Grain</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                min="0"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  touched.quantity && (!formData.quantity || formData.quantity <= 0) ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {touched.quantity && (!formData.quantity || formData.quantity <= 0) && (
                <p className="mt-1 text-sm text-red-500">Enter a valid quantity</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (L)</option>
                <option value="piece">Piece</option>
                <option value="dozen">Dozen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Expiration Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                touched.expirationDate && !formData.expirationDate ? 'border-red-500' : 'border-gray-300'
              }`}
              min={new Date().toISOString().split('T')[0]}
            />
            {touched.expirationDate && !formData.expirationDate && (
              <p className="mt-1 text-sm text-red-500">Expiration date is required</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-gray-700 text-sm font-semibold">
                Product Image
              </label>
              <button
                type="button"
                onClick={toggleImageMode}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {useCustomImage ? 'Use Crop Selection' : 'Upload Custom Image'}
              </button>
            </div>

            {!useCustomImage ? (
              // Crop Selection Mode
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="text-gray-700 font-medium mb-3">Select Your Crop</h3>
                <CropSelector
                  onCropSelect={handleCropSelect}
                  selectedCrop={formData.selectedCrop}
                  category={formData.category}
                />
              </div>
            ) : (
              // Custom Image Upload Mode
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  preview ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          setFormData(prev => ({ ...prev, image: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-1">Drag & drop an image here, or click to select</p>
                      <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`
            px-6 py-3 rounded-lg font-semibold text-white
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }
            transition-all duration-200
          `}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            initialData ? 'Update Product' : 'Add Product'
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
