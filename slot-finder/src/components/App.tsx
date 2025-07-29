import React from "react";
import { AuthProvider } from "../context/AuthContext";
import AppContent from "./AppContent";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
