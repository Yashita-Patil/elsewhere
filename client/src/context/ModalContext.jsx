import { createContext, useContext, useState } from "react";

// Lets any page open the login popup or the "My trips" popup
const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const value = {
    loginOpen,
    dashboardOpen,
    setLoginOpen,
    setDashboardOpen,
    openLogin: () => setLoginOpen(true),
    openDashboard: () => setDashboardOpen(true),
  };
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export const useModals = () => useContext(ModalContext);
