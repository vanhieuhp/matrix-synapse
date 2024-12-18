import React, { useState, useEffect } from "react";
import { useMatrixClient } from "../utils/MatrixContext"; // Assuming MatrixClientContext.js is used for state management
import SearchUser from "./SearchUser";
import { RoomEvent } from "matrix-js-sdk";
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const { matrixClient, logout } = useMatrixClient(); // Access Matrix client and messages from context
  const [rooms, setRooms] = useState([]); // List of available rooms
  const [selectedRoom, setSelectedRoom] = useState(null); // Currently selected room
  const [newMessage, setNewMessage] = useState(""); // New message input
  const [messages, setMessages] = useState([]); // Messages for active rooms
  const [unreadCounts, setUnreadCounts] = useState({});

  console.log("chat page");

  useEffect(() => {
    if (matrixClient) {
      // Fetch rooms
      const fetchRooms = () => {
        const joinedRooms = matrixClient.getRooms();
        setRooms(joinedRooms.map((room) => ({
          id: room.roomId,
          name: room.name || "Unnamed Room",
        })));
      };

      fetchRooms();

      const handleTimelineEvent = async (event, room, toStartOfTimeline) => {
        if (toStartOfTimeline || event.getType() !== "m.room.message") return;

        const newMessage = {
          roomId: room.roomId,
          sender: event.getSender(),
          content: event.getContent().body,
        };

        // If the room is not currently selected, update the unread count
        if (room.roomId !== selectedRoom) {
          const unreadMessagesCount = room.getUnreadNotificationCount();

          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [room.roomId]: unreadMessagesCount,
          }));
        }

        // Only update messages for the selected room
        if (room.roomId === selectedRoom) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      };
      matrixClient.on(RoomEvent.Timeline, handleTimelineEvent);

      // Re-fetch rooms whenever there is a change in sync
      matrixClient.on("sync", fetchRooms);

      // Clean up event listener on unmount or when matrixClient changes
      return () => {
        matrixClient.removeListener(RoomEvent.Timeline, handleTimelineEvent);
        matrixClient.removeListener("sync", fetchRooms);
      };
    }
  }, [matrixClient, selectedRoom]);

  const handleRoomSelect = async (roomId) => {
    setSelectedRoom(roomId);

    // Reset unread count for the selected room
    setUnreadCounts((prevCounts) => ({
      ...prevCounts,
      [roomId]: 0,
    }));

    // Load existing messages for the selected room
    const room = matrixClient.getRoom(roomId);
    if (room) {
      const roomMessages = [];
      room.timeline.forEach((event) => {
        if (event.getType() === "m.room.message") {
          // Assuming `isRead()` checks if a message is read
          matrixClient.sendReadReceipt(event); // Send a read receipt for each unread message
          roomMessages.push({
            roomId: room.roomId,
            sender: event.getSender(),
            content: event.getContent().body
          });
        }
      });

      // .filter((event) => event.getType() === "m.room.message")
      // .map((event) => ({
      //   roomId: room.roomId,
      //   sender: event.getSender(),
      //   content: event.getContent().body
      // }));
      setMessages(roomMessages);
    }
  };

  const handleSendMessage = async () => {
    if (!matrixClient || !selectedRoom || !newMessage.trim()) return;


    try {
      await matrixClient.sendEvent(selectedRoom, "m.room.message", {
        msgtype: "m.text",
        body: newMessage,
      });
      setNewMessage(""); // Clear the message input

    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleLeaveRoom = async () => {
    if (!matrixClient || !selectedRoom) return;

    try {
      await matrixClient.leave(selectedRoom);
      console.log(`Successfully left the room with ID: ${selectedRoom}`);

      const updatedRooms = matrixClient.getRooms();
      setRooms(updatedRooms.map((room) => ({ id: room.roomId, name: room.name || "Unnamed Room" })));

      setSelectedRoom(null);
    } catch (error) {
      console.error("Error leaving the room:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      window.location.reload();
    }
  };


  const formatSenderName = (sender) => {
    // Extract username from the format @username:domain
    const match = sender.match(/^@([^:]+):/);
    return match ? match[1] : sender; // Return the username if matched, otherwise fallback to the full sender
  };

  return (

    <div style={styles.container_chat}>
      <div style={styles.logout_container}>
        <button onClick={handleLogout} style={styles.logout_button}
          onMouseOver={(e) => (e.target.style.background = "RED")}
          onMouseOut={(e) => (e.target.style.background = "#CC2B52")}
        >logout</button>
      </div>

      <h2 style={styles.title}>Chat Page</h2>

      <div>
        <SearchUser selectedRoom={setSelectedRoom} />
      </div>

      <div style={styles.container_chatroom}>
        <div style={styles.sidebar}>
          <h3>Rooms</h3>
          <ul style={styles.roomList}>
            {rooms.map((room) => (
              <li
                key={room.id}
                style={{
                  ...styles.roomItem,
                  backgroundColor: room.id === selectedRoom ? "#007bff" : "#f1f1f1",
                  color: room.id === selectedRoom ? "#fff" : "#000",
                }}
                onClick={() => handleRoomSelect(room.id)}
              >
                {room.name}
                {unreadCounts[room.id] > 0 && (
                  <span style={{ marginLeft: "10px", color: "red" }}>
                    ({unreadCounts[room.id]})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.chatArea}>
          {selectedRoom ? (
            <>
              <div style={styles.messageList}>
                {messages
                  .filter((message) => message.roomId === selectedRoom)
                  .map((message, index) => (
                    <div key={index} style={styles.messageItem}>
                      <strong>{formatSenderName(message.sender)}:</strong> {message.content}
                    </div>
                  ))}
              </div>

              <div style={styles.messageInputContainer}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message"
                  style={styles.messageInput}
                />
                <button onClick={handleSendMessage} style={styles.sendButton}
                  onMouseOver={(e) => (e.target.style.background = "#0056b3")}
                  onMouseOut={(e) => (e.target.style.background = "#007BFF")}
                >
                  Send
                </button>
              </div>
              <div style={styles.leaveButtonContainer}>
                <button style={styles.leaveButton} onClick={handleLeaveRoom}
                  onMouseOver={(e) => (e.target.style.background = "#740938")}
                  onMouseOut={(e) => (e.target.style.background = "#CC2B52")}
                >
                  Leave Room
                </button>
              </div>
            </>
          ) : (
            <p>Please select a room to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container_chat: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    minWidth: "1000px",
    width: "100vh",
    backgroundColor: "#D9EAFD",
    border: "1px solid #ddd",
    borderRadius: "20px",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#009990",
    fontSize: '32px',
    fontWeight: '700',
  },
  container_chatroom: {
    backgroundColor: "#fff",
    display: "flex",
    height: "80%",
    margin: "20px",
    borderRadius: "10px",
  },

  sidebar: {
    width: "25%",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
    borderTopLeftRadius: "10px",    // Match container border radius
    borderBottomLeftRadius: "10px", // Match container border radius
  },
  header: {
    fontSize: "2rem",
    color: "#333",
    marginBottom: "20px",
  },
  roomList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  roomItem: {
    padding: "15px",
    cursor: "pointer",
    marginBottom: "10px",
    borderRadius: "5px",
    transition: "background-color 0.3s ease, color 0.3s ease",
  },
  chatArea: {
    width: "75%",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    marginBottom: "20px",
    paddingBottom: "20px",
    maxHeight: "600px",
  },
  messageItem: {
    marginBottom: "10px",
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "5px",
    boxShadow: "1px rgba(0, 0, 0, 0.1)",
  },
  messageInputContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "15px",
  },
  messageInput: {
    flex: 1,
    padding: "15px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    marginRight: "10px",
    backgroundColor: "#fff",
    transition: "border-color 0.3s ease",
  },
  sendButton: {
    padding: "12px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    width: "150px",
  },
  leaveButtonContainer: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "flex-end",
  },
  leaveButton: {
    padding: "12px 20px",
    width: "150px",
    fontSize: "16px",
    backgroundColor: "#CC2B52",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  logout_container: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "20px 20px 0 0",
  },
  logout_button: {
    padding: "15px 20px",
    background: "#CC2B52",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  }
};

export default ChatPage;
