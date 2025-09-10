import { useState, useCallback } from 'react';
import axios from 'axios';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/api/products', productData, {
        headers: {
          'Content-Type': productData instanceof FormData 
            ? 'multipart/form-data'
            : 'application/json'
        }
      });
      setProducts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`http://localhost:5000/api/products/${id}`, productData, {
        headers: {
          'Content-Type': productData instanceof FormData 
            ? 'multipart/form-data'
            : 'application/json'
        }
      });
      setProducts(prev => prev.map(product => 
        product._id === id ? response.data : product
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setProducts(prev => prev.filter(product => product._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
};

export default useProducts;
