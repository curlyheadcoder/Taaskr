import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useUserRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    const handleStorageChange = () => {
      if (!localStorage.getItem('taaskr_token')) {
        setRole(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { role, loading };
}
