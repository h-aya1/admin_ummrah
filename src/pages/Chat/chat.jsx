import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../contexts/AppContext";
import { io } from "socket.io-client";
import "./chat.css";

const API_BASE_URL = "http://69.62.109.18:3001";
const SOCKET_URL = "http://69.62.109.18:3001/chat";

const getUserColor = (userId) => {
  let hash = 0;
  if (!userId || userId.length === 0) return '#FFFFFF';
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    const brightenedValue = Math.min(255, value + 70);
    color += ('00' + brightenedValue.toString(16)).substr(-2);
  }
  return color;
};

const MessageRenderer = ({ content }) => {
  if (!content) return null;
  const regex = /(https?:\/\/[^\s]+)|(#[a-zA-Z0-9_]+)/g;
  const parts = content.split(regex).filter(Boolean);
  return (
    <div className="message-text">
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="message-link">{part}</a>;
        }
        if (part.match(/^#/)) {
          return <span key={index} className="message-tag">{part}</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

const Chat = () => {
  const { groups, authToken, currentUser, refreshGroups } = useAppContext();
  const [localMessages, setLocalMessages] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshGroups();
      setLoading(false);
    };
    loadData();
  }, [refreshGroups]);

  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  useEffect(() => {
    if (selectedGroup && authToken) {
      fetchHistoricalMessages(selectedGroup.id);
      connectToGroupChat(selectedGroup.id);
    }
    return () => {
      disconnectFromChat();
    };
  }, [selectedGroup, authToken]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const fetchHistoricalMessages = async (groupId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch messages: ${response.statusText}`);
      const result = await response.json();
      
      const sortedMessages = (result.data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setLocalMessages(sortedMessages);

    } catch (error) {
      console.error("Error fetching historical messages:", error);
      alert("Could not load chat history for this group.");
    }
  };

  const connectToGroupChat = (groupId) => {
    disconnectFromChat();
    setConnectionStatus("connecting");
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setConnectionStatus("error");
      return;
    }
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      query: { groupId },
      auth: { token },
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("error"));
    socket.on("error", (error) => console.error("Server-side socket error:", error));
    
    socket.on("messageHistory", (history) => {
        const sortedHistory = (history || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setLocalMessages(sortedHistory);
    });

    socket.on("newMessage", (message) => {
      // This listener is now only for messages from OTHER users.
      if (message.groupId === groupId) {
        setLocalMessages((prevMessages) => [...prevMessages, message]);
      }
    });
  };

  const disconnectFromChat = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = null;
  };
  
  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ========================= REAL-TIME FIX: REWRITTEN FUNCTION =========================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const hasText = newMessage.trim().length > 0;
    const hasImage = !!imageFile;

    if ((!hasText && !hasImage) || sendingMessage || !socketRef.current || connectionStatus !== "connected") {
      return;
    }

    setSendingMessage(true);

    // 1. Create a temporary message for optimistic UI update.
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: hasText ? newMessage.trim() : null,
      imageUrl: imagePreview, // Use the local preview for the optimistic update
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      groupId: selectedGroup.id,
      isSending: true, // Custom flag for styling pending messages
    };

    // 2. Add the optimistic message to state immediately for a fluid UI.
    setLocalMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    
    // 3. Clear inputs right away.
    setNewMessage("");
    setImageFile(null);
    setImagePreview(null);
    
    try {
      let uploadedImageUrl = null;
      if (hasImage) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", imageFile);
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${API_BASE_URL}/chat/upload-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!response.ok) throw new Error("Image upload failed");
        const result = await response.json();
        uploadedImageUrl = result.url;
        setIsUploading(false);
      }

      const payload = {
        content: hasText ? newMessage.trim() : undefined,
        imageUrl: uploadedImageUrl,
      };

      // 4. Emit message and wait for an acknowledgment from the server.
      socketRef.current.emit("sendMessage", payload, (response) => {
        // This callback is executed by the server.
        if (response && response.status === 'ok' && response.data) {
          // Find our temporary message and replace it with the real one from the server.
          setLocalMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === tempId ? response.data : msg
            )
          );
        } else {
          // If sending failed, update the UI to show an error.
          console.error("Failed to send message:", response?.error);
          alert(`Failed to send message: ${response?.error}`);
          setLocalMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === tempId ? { ...msg, isSending: false, error: true } : msg
            )
          );
        }
      });

    } catch (error) {
      console.error("Error sending message:", error);
      alert(error.message);
      setIsUploading(false);
      // Update the optimistic message to show an error state if upload fails.
      setLocalMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempId ? { ...msg, isSending: false, error: true } : msg
          )
        );
    } finally {
      setSendingMessage(false);
    }
  };
  // ====================================================================================
  
  const canSendMessage = () => currentUser?.role === "admin";
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) handleSendMessage(e); };

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
      <div className="page-header"><h1>Group Chat</h1></div>
      <div className="chat-container">
        <div className="groups-sidebar">
          <h3>Groups ({groups.length})</h3>
          {groups.length === 0 ? (<div className="no-groups"><p>No groups available.</p></div>) : (
            <div className="groups-list">
              {groups.map((group) => (
                <div key={group.id} className={`group-item ${selectedGroup?.id === group.id ? "selected" : ""}`} onClick={() => setSelectedGroup(group)}>
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
                  <div className={`connection-status ${connectionStatus}`}><span className="status-indicator"></span><span className="status-text">{connectionStatus}</span></div>
                  <p>Amir: {selectedGroup.amir}</p>
                </div>
              </div>
              <div className="messages-container">
                <div className="messages-list">
                  {localMessages.map((message) => {
                      const userColor = getUserColor(message.sender?.id);
                      // Add a visual indicator for messages that failed to send
                      const messageItemClass = message.error ? "message-item error" : "message-item";
                      const messageOpacity = message.isSending ? 0.6 : 1;

                      return (
                        <div key={message.id} className={messageItemClass} style={{ opacity: messageOpacity }}>
                          <div className="message-avatar">
                            <span>{message.sender?.name?.charAt(0) || "U"}</span>
                            <div className={`role-indicator ${message.sender?.role || 'pilgrim'}`}></div>
                          </div>
                          <div className="message-content">
                            <div className="message-header">
                              <span className="sender-name" style={{ color: userColor }}>
                                {message.sender?.name || 'Unknown User'}
                              </span>
                              <span className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
                            </div>
                            {message.imageUrl && (
                              <a href={message.imageUrl.startsWith('blob:') ? message.imageUrl : `${API_BASE_URL}${message.imageUrl}`} target="_blank" rel="noopener noreferrer">
                                 <img src={message.imageUrl.startsWith('blob:') ? message.imageUrl : `${API_BASE_URL}${message.imageUrl}`} alt="Chat attachment" className="message-image" />
                              </a>
                            )}
                            <MessageRenderer content={message.content} />
                             {message.error && <span style={{ color: 'red', fontSize: '12px' }}>Failed to send</span>}
                          </div>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>
                {canSendMessage() && (
                  <div className="message-input-container">
                    <form onSubmit={handleSendMessage} className="message-input-form">
                      {imagePreview && (
                        <div className="image-preview-container">
                          <img src={imagePreview} alt="Selected preview" className="image-preview" />
                          <button type="button" className="remove-preview-btn" onClick={removeImagePreview}>&times;</button>
                        </div>
                      )}
                      <div className="input-wrapper">
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} style={{ display: "none" }} accept="image/png, image/jpeg, image/gif" />
                        <button type="button" className="btn-attach" onClick={() => fileInputRef.current.click()} disabled={sendingMessage || isUploading}>
                          📎
                        </button>
                        <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message..." className="message-input" rows={2} disabled={sendingMessage || isUploading} />
                        <button type="submit" className="btn btn-primary" disabled={(!newMessage.trim() && !imageFile) || sendingMessage || isUploading}>
                          {isUploading ? "Uploading..." : sendingMessage ? "Sending..." : "Send"}
                        </button>
                      </div>
                      {connectionStatus !== "connected" && (<div className="connection-warning">⚠️ Not connected to chat. Messages cannot be sent.</div>)}
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-group-selected"><h3>Select a group to view chat</h3></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;