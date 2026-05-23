import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app tree and exposes:
 *   user    → decoded user object { _id, name, email, role }
 *   token   → raw JWT string
 *   login   → async (email, password) => user
 *   logout  → clears storage + resets state
 *   loading → true while hydrating from localStorage
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  // Hydrate user from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexus_user');
      if (raw && token) setUser(JSON.parse(raw));
    } catch {
      // corrupt storage — clear it
      localStorage.removeItem('nexus_user');
      localStorage.removeItem('nexus_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    // Server returns: { success, message, data: { _id, name, email, role, token } }
    const { token: newToken, ...newUser } = data.data;
    localStorage.setItem('nexus_token', newToken);
    localStorage.setItem('nexus_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
