import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import ChatPage from "./components/ChatPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
  };

  const handleSignupSuccess = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
  };

  return (
    <Router>
      <div style={styles.root_container}>
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/chat" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/chat" replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          <Route
            path="/signup"
            element={
              isLoggedIn ? (
                <Navigate to="/chat" replace />
              ) : (
                <SignupPage onSignupSuccess={handleSignupSuccess} />
              )
            }
          />

          <Route
            path="/chat"
            element={
              isLoggedIn ? (
                <ChatPage
                  userData={userData}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Redirect any unmatched route to home */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

const styles = {
  root_container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    margin: '0',
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  }
};

export default App;