// src/components/chat/Chat.js

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../contexts/AppContext";
import { io } from "socket.io-client";
import "./chat.css";

// Define your backend URLs in one place for easy configuration
const API_BASE_URL = "http://localhost:3001";
const SOCKET_URL = "http://localhost:3001/chat";

const Chat = () => {
  // Destructure all necessary values and functions from the AppContext
  const {
    groups,
    messages,
    addMessage,
    setMessagesForGroup,
    authToken,
    currentUser,
    refreshGroups,
  } = useAppContext();

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Effect for initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Ensure the groups list is up-to-date when the component mounts
      await refreshGroups();
      setLoading(false);
    };
    loadData();
  }, [refreshGroups]);

  // Effect to auto-select the first group when the component loads or groups list changes
  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);


  // Main effect for handling chat connections and data fetching
  useEffect(() => {
    // Only proceed if a group is selected and the user is authenticated
    if (selectedGroup && authToken) {
      // 1. Fetch historical messages via the REST API for the selected group
      fetchHistoricalMessages(selectedGroup.id);

      // 2. Connect to the WebSocket for real-time updates.
      // The backend requires a groupId in the JWT payload for an admin to join a specific room.
      // A more advanced solution might involve a dedicated backend endpoint for an admin to
      // get a temporary, group-specific token. For now, we assume the backend handles this.
      connectToGroupChat(authToken);
    }

    // 3. Cleanup function: This is crucial. It runs when the component unmounts
    // OR when the `selectedGroup` changes, ensuring we disconnect from the old room before joining a new one.
    return () => {
      disconnectFromChat();
    };
  }, [selectedGroup, authToken]); // This effect re-runs whenever the selected group or auth token changes

  // Effect to auto-scroll to the latest message whenever the messages array updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============ REAL API AND WEBSOCKET FUNCTIONS ============

  /**
   * Fetches the initial chat history for a group using the REST endpoint.
   */
  const fetchHistoricalMessages = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      
      const result = await response.json(); // The backend returns { data: [messages], total, page, lastPage }
      
      // Use the new context function to replace the messages for this specific group,
      // preventing messages from different groups from mixing in the state.
      setMessagesForGroup(groupId, result.data);

    } catch (error) {
      console.error("Error fetching historical messages:", error);
      alert("Could not load chat history for this group.");
    }
  };


  /**
   * Establishes a real WebSocket connection to the NestJS backend using socket.io-client.
   */
  const connectToGroupChat = (token) => {
    disconnectFromChat(); // Ensure any old connection is closed first
    setConnectionStatus("connecting");
    
    // Create the socket instance with the necessary auth headers for the handshake
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Store the socket instance in a ref to persist it across re-renders
    socketRef.current = socket;

    // --- SETUP EVENT LISTENERS for this specific socket instance ---
    
    socket.on("connect", () => {
      console.log(`Connected to chat server with socket ID: ${socket.id}`);
      setConnectionStatus("connected");
    });
    
    socket.on("disconnect", () => {
      console.log("Disconnected from chat server.");
      setConnectionStatus("disconnected");
    });
    
    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
      setConnectionStatus("error");
    });

    // Listens for the initial batch of messages sent by the server upon a successful connection
    socket.on("messageHistory", (history) => {
      console.log("Received message history via WebSocket:", history);
      if (selectedGroup) {
         setMessagesForGroup(selectedGroup.id, history);
      }
    });

    // Listens for new, live messages broadcasted by the server to the room
    socket.on("newMessage", (message) => {
      console.log("New live message received:", message);
      // Only add the message to the global state if it belongs to the currently viewed group
      if (message.groupId === selectedGroup?.id) {
        addMessage(message);
      }
    });
  };

  /**
   * Disconnects from the WebSocket server and cleans up the reference to avoid memory leaks.
   */
  const disconnectFromChat = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  /**
   * Sends a message to the server using `emitWithAck` to get a direct confirmation callback.
   */
  const sendMessage = async (messageText) => {
    if (!selectedGroup || !messageText.trim() || !socketRef.current || connectionStatus !== 'connected') {
        return;
    }
    
    setSendingMessage(true);

    const payload = {
      content: messageText.trim(),
    };

    // Use `emitWithAck` which provides a callback from the server, confirming receipt and processing.
    socketRef.current.emit("sendMessage", payload, (response) => {
      setSendingMessage(false);
      
      if (response && response.status === "ok") {
        console.log("Message sent and acknowledged by server:", response.message);
        // Add the server-confirmed message to our state. This is the source of truth.
        addMessage(response.message);
        setNewMessage(""); // Clear the input field only on successful send
      } else {
        console.error("Server failed to process message:", response?.error);
        alert(`Failed to send message: ${response?.error || 'An unknown error occurred'}`);
      }
    });
  };
  
  // ============ UTILITY AND HANDLER FUNCTIONS ============
  
  const canSendMessage = () => {
    // This is a client-side UI check. The server is the ultimate authority on permissions.
    return currentUser?.role === "admin";
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && !sendingMessage) {
      sendMessage(newMessage);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="page-header">
        <h1>Group Chat</h1>
      </div>

      <div className="chat-container">
        <div className="groups-sidebar">
          <h3>Groups ({groups.length})</h3>
          {groups.length === 0 ? (
            <div className="no-groups">
              <p>No groups available.</p>
            </div>
          ) : (
            <div className="groups-list">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`group-item ${
                    selectedGroup?.id === group.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="group-info">
                    <div className="group-name">{group.name}</div>
                    <div className="group-amir">Amir: {group.amir}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-main">
          {selectedGroup ? (
            <>
              <div className="chat-header">
                <div className="chat-info">
                  <h2>{selectedGroup.name}</h2>
                  <div className={`connection-status ${connectionStatus}`}>
                    <span className="status-indicator"></span>
                    <span className="status-text">{connectionStatus}</span>
                  </div>
                  <p>Amir: {selectedGroup.amir}</p>
                </div>
              </div>

              <div className="messages-container">
                <div className="messages-list">
                  {messages
                    .filter((message) => message.groupId === selectedGroup?.id)
                    .map((message) => (
                      <div key={message.id} className={`message-item`}>
                        <div className="message-avatar">
                          <span>{message.sender?.name?.charAt(0) || "U"}</span>
                          <div className={`role-indicator ${message.sender?.role || 'pilgrim'}`}></div>
                        </div>

                        <div className="message-content">
                          <div className="message-header">
                            <span className="sender-name">{message.sender?.name || 'Unknown User'}</span>
                            <span className="message-time">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className={`message-text`}>{message.content}</div>
                        </div>
                      </div>
                    ))}
                  <div ref={messagesEndRef} />
                </div>

                {canSendMessage() && (
                  <div className="message-input-container">
                    <form onSubmit={handleSendMessage} className="message-input-form">
                      <div className="input-wrapper">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="message-input"
                          rows={2}
                          disabled={sendingMessage || connectionStatus !== "connected"}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!newMessage.trim() || sendingMessage || connectionStatus !== "connected"}
                        >
                          {sendingMessage ? "Sending..." : "Send"}
                        </button>
                      </div>
                      {connectionStatus !== "connected" && (
                        <div className="connection-warning">
                          ⚠️ Not connected to chat. Messages cannot be sent.
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-group-selected">
              <h3>Select a group to view chat</h3>
              <p>Choose a group from the sidebar to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;