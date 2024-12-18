import React, { useState } from "react";
import config from "../config"; // Import the config file
import { useNavigate } from 'react-router-dom';  // Use `useNavigate` instead of `useHistory`
import { useMatrixClient } from "../utils/MatrixContext"; // Assuming MatrixClientContext.js is used for state management

const SignupPage = ({ onSignupSuccess }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Initialize `navigate` hook
    const { initializeMatrixClient } = useMatrixClient();


    const handleSignup = async (e) => {
        e.preventDefault(); // Prevent form submission default behavior

        // Ensure the username and password are provided
        if (username.trim() === "" || password.trim() === "") {
            setError("Username and password are required.");
            return;
        }

        try {
            const response = await fetch(`${config.API_BASE_URL}/_matrix/client/r0/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    auth: {
                        type: "m.login.dummy", // Dummy login method
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                data['username'] = username; // Add the username to the data object
                data['password'] = password; // Add the password to the data object
                console.log(data);

                initializeMatrixClient(data); // Initialize the client

                // Call onLoginSuccess to handle login state in parent component
                onSignupSuccess(data);

                // Redirect to the chat page
                navigate('/chat');
            } else {
                const data = await response.json();
                setError(data.error || "Signup failed. Please try again.");
            }
        } catch (error) {
            setError("An error occurred while trying to sign up.");
            console.error(error);
        }
    };

    return (
        <div style={styles.container_signup}>
            <h1>Signup for Matrix</h1>
            <form onSubmit={handleSignup} style={styles.signup_form}>
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
                            Signup
                    </button>
                    <button type="button"
                            style={styles.button_secondary}
                            onMouseOver={(e) => (e.target.style.background = "#5DB996")}
                            onMouseOut={(e) => (e.target.style.background = "#118B50")}
                            onClick={() => (window.location.href = "/login")}
                        >
                            Login Page
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container_signup: {
        padding: "20px",
        background: "#D9EAFD",
        borderRadius: "10px",
        width: "400px",
        margin: "auto",
        marginTop: "100px",
        textAlign: "center",
        minHeight: "500px",
    },
    signup_form: {
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

export default SignupPage;
