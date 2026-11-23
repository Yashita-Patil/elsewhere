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
    return data.user;
  };

  const login = async (email, password) => handleAuthSuccess(await api.post("/auth/login", { email, password }));

  const register = async (name, email, password) =>
    handleAuthSuccess(await api.post("/auth/register", { name, email, password }));

  const logout = () => {
    clearToken();
    setUser(null);
  };

  // Update profile details
  const updateProfile = async (profileData) => {
    const data = await api.put("/users/profile", profileData);
    setUser(data.user);
    return data;
  };

  // Change password
  const updatePassword = async (currentPassword, newPassword) => {
    return await api.put("/users/password", { currentPassword, newPassword });
  };

  // Delete account
  const deleteAccount = async () => {
    const res = await api.delete("/users/account");
    clearToken();
    setUser(null);
    return res;
  };

  // Heart button: add or remove a saved destination (needs login)
  const toggleSaved = async (destinationId) => {
    const data = await api.put(`/users/saved/${destinationId}`);
    setUser((current) => ({ ...current, savedPlaces: data.savedPlaces }));
    return data;
  };

  // Explicit remove from saved destinations
  const removeSaved = async (destinationId) => {
    const data = await api.delete(`/users/saved/${destinationId}`);
    setUser((current) => ({ ...current, savedPlaces: data.savedPlaces }));
    return data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    deleteAccount,
    toggleSaved,
    removeSaved,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
