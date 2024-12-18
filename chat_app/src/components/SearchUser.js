import React, { useState } from "react";
import { useMatrixClient } from "../utils/MatrixContext"; // Assuming MatrixClientContext.js is used for state management

const SearchUser = ({ selectedRoom }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { matrixClient } = useMatrixClient(); // Use the Matrix client context

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);

    try {
      const response = await matrixClient.searchUserDirectory({ term: searchTerm.trim() });
      setSearchResults(response.results || []);
      console.log(response.results);
    } catch (err) {
      setError("Failed to search users. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToUser = async (user) => {
    try {
      // Check if a room with the user already exists
      const existingRoom = matrixClient.getRooms().find(room =>
        room.getMembers().some(member => member.userId === user.user_id)
      );
  
      if (existingRoom) {
        console.log('Found existing room:', existingRoom.roomId);
        // Handle selecting or reusing the existing room
        if (typeof selectedRoom === 'function') {
          selectedRoom(existingRoom.roomId);
        } else {
          console.warn('selectedRoom function is not defined');
        }
      } else {
        // Create a new room if none exists
        const room = await matrixClient.createRoom({
          invite: [user.user_id], // Invite the user to the room
          isDirect: true, // Make it a direct message room
          preset: 'trusted_private_chat', // Ensure privacy
          visibility: 'private',
        });
  
        console.log('Created new room:', room.room_id);
  
        // Send a message to the newly created room
        const content = {
          msgtype: "m.text",
          body: 'Hi, I would like to connect with you!',
        };
  
        try {
          await matrixClient.sendEvent(room.room_id, "m.room.message", content);
          console.log('Message sent successfully');
        } catch (sendError) {
          console.error("Failed to send message:", sendError);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={styles.container_search}>
      <div style={styles.searchBar}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for users..."
        />
        <button style={styles.button_search} onClick={handleSearch} disabled={loading}
          onMouseOver={(e) => (e.target.style.background = "#0056b3")}
          onMouseOut={(e) => (e.target.style.background = "#007BFF")}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      <div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div key={user.user_id}>
                  <span style={styles.search_result_display_name}>{user.display_name || user.user_id}</span>
                  <button style={styles.button_add_friend} onClick={() => sendMessageToUser(user)}
                    onMouseOver={(e) => (e.target.style.background = "#0056b3")}
                    onMouseOut={(e) => (e.target.style.background = "#007BFF")}
                  >
                    Add Friend
                  </button>
                </div>
              ))
            ) : <div></div>}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  searchBar: { display: "flex", gap: "10px", marginBottom: "10px" },
  input: { flex: "1", padding: "10px", fontSize: "16px" },
  button: { padding: "10px 20px", fontSize: "16px", cursor: "pointer" },
  error: { color: "red", marginTop: "10px" },
  resultList: { listStyleType: "none", padding: "0", marginTop: "10px" },
  resultItem: {
    padding: "10px",
    borderBottom: "1px solid #ccc",
    cursor: "pointer",
    backgroundColor: "#f9f9f9",
  },

  container_search: {
    flexDirection: "column",
    display: "flex",  // Added display flex
    alignItems: "center",
    justifyContent: "center", // Added to center horizontally
  },
  button_search: {
    padding: "10px 20px",
    fontSize: "16px",
    background: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  button_add_friend: {
    marginLeft: "10px",
    padding: "10px 20px",
    fontSize: "16px",
    background: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  search_result_display_name: {
    padding: "10px",
    fontSize: "20px",
    fontWeight: "bold",
  }
};

export default SearchUser;
