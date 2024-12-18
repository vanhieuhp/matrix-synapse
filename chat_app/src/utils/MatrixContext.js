import React, { createContext, useState, useContext } from "react";
import { createClient, ClientEvent, RoomEvent } from "matrix-js-sdk";
import config from "../config";
import { KnownMembership } from "matrix-js-sdk/lib/@types/membership.js";

// Create context for managing Matrix client
const MatrixClientContext = createContext();

// Custom hook to use Matrix client context
export const useMatrixClient = () => {
  const context = useContext(MatrixClientContext);
  if (!context) {
    throw new Error("useMatrixClient must be used within a MatrixClientProvider");
  }
  return context;
};

export const MatrixClientProvider = ({ children }) => {
  const [matrixClient, setMatrixClient] = useState(null);
  const [members, setMembers] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  const [isClientInitialized, setIsClientInitialized] = useState(false);
  const [error, setError] = useState(null);

  const initializeMatrixClient = async (loginData) => {
    try {
      // Validate login data
      if (!loginData?.access_token || !loginData?.user_id) {
        throw new Error("Invalid login data");
      }

      // Save login data to localStorage
      localStorage.setItem("loginData", JSON.stringify(loginData));

      // Create and configure the Matrix client
      const client = createClient({
        baseUrl: config.API_BASE_URL,
        accessToken: loginData.access_token,
        userId: loginData.user_id,
        deviceId: loginData.device_id,
      });

      // Setup event listeners
      client.once(ClientEvent.Sync, (state) => {
        if (state === "PREPARED") {
          console.log("Matrix client is ready!");
          setIsClientInitialized(true);
        } else {
          console.warn(`Unexpected sync state: ${state}`);
          setError(`Sync error: ${state}`);
        }
      });

      client.on(ClientEvent.Sync, (state) => {
        if (state === "SYNCING") {
          console.log("Matrix client is syncing...");
        }
      });

      client.on(ClientEvent.Error, (err) => {
        console.error("Matrix client error:", err);
        setError(err.message);
      });

      client.on(RoomEvent.MyMembership, function (room, membership, prevMembership) {
        if (membership === KnownMembership.Invite) {
          client.joinRoom(room.roomId).then(function () {
            console.log("Auto-joined %s", room.roomId);
          });
        }
      });

      // Start the Matrix client
      await client.startClient({ initialSyncLimit: 20 });
      setMatrixClient(client);

      console.log("Matrix client initialized successfully:", loginData);
      return client;
    } catch (err) {
      console.error("Failed to initialize Matrix client:", err);
      setError(err.message);
    }
  };

  const logout = async () => {
    try {
      if (matrixClient) {
        console.log("Logging out from Matrix client...");
        await matrixClient.logout(); // Logout the Matrix client
        setMatrixClient(null);
        setIsClientInitialized(false);
        localStorage.clear(); // Clear all localStorage data
        sessionStorage.clear(); // Clear sessionStorage data (if used)

        console.log("Logged out successfully");
      }
    } catch (err) {
      console.error("Failed to logout Matrix client:", err);
      setError(err.message); // Optional: Handle error state
    }
  };

  const contextValue = {
    matrixClient,
    initializeMatrixClient,
    logout,
    members,
    typingStatus,
    isClientInitialized,
    error,
  };

  return (
    <MatrixClientContext.Provider value={contextValue}>
      {children}
    </MatrixClientContext.Provider>
  );
};
