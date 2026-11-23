import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, clearToken, getToken } from "../api";

// Holds the logged-in user so every page and component can read it with useAuth()
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token

  // On page load: if a token is saved, ask the server who it belongs to
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => clearToken()) // token expired or invalid
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email, password) => handleAuthSuccess(await api.post("/auth/login", { email, password }));

  const register = async (name, email, password) =>
    handleAuthSuccess(await api.post("/auth/register", { name, email, password }));

  const logout = () => {
    clearToken();
    setUser(null);
  };

  // Heart button: add or remove a saved destination (needs login)
  const toggleSaved = async (destinationId) => {
    const data = await api.put(`/users/saved/${destinationId}`);
    setUser((current) => ({ ...current, savedPlaces: data.savedPlaces }));
  };

  const value = { user, loading, login, register, logout, toggleSaved };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
