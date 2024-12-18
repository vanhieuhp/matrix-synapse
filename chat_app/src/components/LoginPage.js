import React, { useState, useEffect } from "react";
import config from "../config"; // Assuming config.js holds your API base URL
import { useNavigate } from 'react-router-dom';
import { useMatrixClient } from "../utils/MatrixContext"; // Assuming MatrixClientContext.js is used for state management

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("fruitful"); // Default username
  const [password, setPassword] = useState("Bloodstock.exchange"); // Default password
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { initializeMatrixClient } = useMatrixClient();
  console.log("login page");  
  useEffect(() => {
    const restoreSession = () => {
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      if (loginData) {
        console.log("Restoring session with stored login data...");
        initializeMatrixClient(loginData);
        // Initialize the Matrix client using the returned credentials
        onLoginSuccess(loginData);
        // Redirect to the chat page
      console.log("login page");  
        // navigate('/chat');
      } else {
        console.log("No session found. Redirecting to login page.");
      }
    };

    restoreSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page

    try {
      const response = await fetch(`${config.API_BASE_URL}/_matrix/client/v3/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "m.login.password",
          user: `@${username}:${config.DOMAIN}`,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        data['username'] = username; // Add the username to the data object
        data['password'] = password; // Add the password to the data object

        try {
          const client = await initializeMatrixClient(data); // Set the client in the context
          console.log(client);
          if (client) {
            console.log("Matrix client created:", client);
          } else {
            setError("Internal error. Please try again.");
            return;
          }
        } catch (err) {
          console.error("Error initializing Matrix client:", err);
          setError("Failed to initialize Matrix client. Please try again.");
        }

        // Initialize the Matrix client using the returned credentials
        onLoginSuccess(data);

        // Redirect to the chat page
        navigate('/chat');
      } else {
        const data = await response.json();
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred while trying to log in.");
      console.error(error);
    }
  };

  return (
    <div style={styles.container_login}>
      <h2>Login to Matrix</h2>

      <form onSubmit={handleLogin} style={styles.login_form}>
        <div style={styles.inputContainer}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={styles.input}
          />
        </div>

        <div style={styles.inputContainer}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={styles.input}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.button}
            onMouseOver={(e) => (e.target.style.background = "#0056b3")}
            onMouseOut={(e) => (e.target.style.background = "#007BFF")}
          >
            Login
          </button>
          <button type="button"
            style={styles.button_secondary}
            onMouseOver={(e) => (e.target.style.background = "#5DB996")}
            onMouseOut={(e) => (e.target.style.background = "#118B50")}
            onClick={() => (window.location.href = "/signup")}
          >
            Signup Page
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container_login: {
    padding: "20px",
    background: "#D9EAFD",
    borderRadius: "10px",
    width: "400px",
    margin: "auto",
    marginTop: "100px",
    textAlign: "center",
    minHeight: "500px",
  },
  login_form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "flex-start", // Added to align form items to the left
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    width: "90%", // Added to make the input full width
    alignItems: "flex-start" // Added to align form items to the left
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    marginBottom: "10px",
    width: "100%" // Added to make the input
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    background: "#007BFF",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    width: "150px",
    borderRadius: "5px", // Added to make the button rounded
  },
  button_secondary: {
    padding: "10px 20px",
    fontSize: "16px",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    background: "#118B50",
    width: "150px",
    borderRadius: "5px", // Added to make the button rounded
  },
  error: { color: "red", marginBottom: "10px" },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "10px",
    gap: "10px",
  }
};

export default LoginPage;
