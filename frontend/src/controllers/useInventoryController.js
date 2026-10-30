/**
 * useInventoryController.js
 * Controller orchestrating inventory valuation, stock adjustments, and replenishment alerts.
 */
import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../services/inventoryService";

export function useInventoryController() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await inventoryService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error("Error loading inventory summary:", err);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await inventoryService.getStockAlerts();
      setAlerts(data?.results || data || []);
    } catch (err) {
      console.error("Error loading stock alerts:", err);
    }
  }, []);

  const loadTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await inventoryService.getTransactions(params);
      setTransactions(data?.results || data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load audit transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustStock = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const result = await inventoryService.adjustStock(payload);
        await Promise.all([loadSummary(), loadAlerts(), loadTransactions()]);
        return result;
      } catch (err) {
        const detail = err.response?.data?.detail || "Stock adjustment failed.";
        setError(detail);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadSummary, loadAlerts, loadTransactions]
  );

  useEffect(() => {
    loadSummary();
    loadAlerts();
    loadTransactions();
  }, [loadSummary, loadAlerts, loadTransactions]);

  return {
    summary,
    transactions,
    alerts,
    loading,
    error,
    adjustStock,
    refresh: () => Promise.all([loadSummary(), loadAlerts(), loadTransactions()]),
  };
}
