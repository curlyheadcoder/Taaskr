import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';

export function useUserRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const profile = await api.auth.me();
        setRole(profile?.role || null);
      } catch (err) {
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [location.pathname]);

  return { role, loading };
}
