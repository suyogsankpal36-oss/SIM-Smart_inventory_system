/**
 * useDashboardController.js
 * Controller orchestrating executive dashboard telemetry, periodic synchronization,
 * and KPI model instantiation.
 */
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { DashboardKPIModel } from "../models/DashboardModel";

export function useDashboardController(autoRefreshIntervalMs = 60000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/");
      setData(new DashboardKPIModel(response.data));
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (autoRefreshIntervalMs > 0) {
      const timer = setInterval(fetchStats, autoRefreshIntervalMs);
      return () => clearInterval(timer);
    }
  }, [fetchStats, autoRefreshIntervalMs]);

  return {
    kpis: data,
    loading,
    error,
    refresh: fetchStats,
  };
}
