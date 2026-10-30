/**
 * useProductsController.js
 * Controller orchestrating catalog queries, pagination, category filtering, and product lifecycle.
 */
import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { ProductItemModel } from "../models/ProductModel";

export function useProductsController(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data?.results || data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const fetchProducts = useCallback(async (customParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, ...customParams };
      const response = await productService.getProducts(params);
      const rawList = response?.results || response || [];
      setProducts(rawList.map((p) => new ProductItemModel(p)));
      setTotalCount(response?.count ?? rawList.length);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    categories,
    filters,
    setFilters,
    loading,
    error,
    totalCount,
    refresh: fetchProducts,
  };
}
