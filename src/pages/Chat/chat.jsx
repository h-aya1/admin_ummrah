import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { io } from 'socket.io-client';
import { MessageItem } from '../../components/chat/MessageItem';
import './chat.css';

// --- Configuration ---
const API_BASE_URL = 'http://69.62.109.18:3001';
const SOCKET_URL = 'http://69.62.109.18:3001/chat';

// --- Helper Components ---
const AttachmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

// --- Main Chat Component ---
const Chat = () => {
  const { groups, authToken, currentUser, refreshGroups } = useAppContext();

  // --- State Management ---
  const [localMessages, setLocalMessages] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // --- Refs ---
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --- Effects ---
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

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    if (localMessages.length > 0) {
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 150;
      if (isScrolledToBottom) {
        scrollToBottom();
      }
    }
  }, [localMessages, scrollToBottom]);

  // --- Data Fetching & Socket Logic ---
  const fetchHistoricalMessages = async (groupId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/chat/group/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch messages: ${response.statusText}`);
      const result = await response.json();
      setLocalMessages(result.data || []);
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (error) {
      console.error('Error fetching historical messages:', error);
      alert('Could not load chat history for this group.');
    }
  };

  const connectToGroupChat = (groupId) => {
    disconnectFromChat();
    setConnectionStatus('connecting');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setConnectionStatus('error');
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: { groupId },
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', () => setConnectionStatus('error'));
    socket.on('error', (error) => {
      console.error('Server-side socket error:', error);
      alert(`An error occurred: ${error.message}`);
    });

    socket.on('newMessage', (message) => setLocalMessages((prev) => [...prev, message]));
    socket.on('messageUpdated', (updatedMessage) => {
      setLocalMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)));
    });
    socket.on('messageDeleted', (deletedMessage) => {
      setLocalMessages((prev) => prev.map((msg) => (msg.id === deletedMessage.id ? deletedMessage : msg)));
    });
    socket.on('userTyping', ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        const newTypingUsers = { ...prev };
        if (isTyping) newTypingUsers[username] = true;
        else delete newTypingUsers[username];
        return newTypingUsers;
      });
    });
  };

  const disconnectFromChat = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // --- User Actions ---
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = null;
  };

  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const hasText = newMessage.trim().length > 0;
    const hasImage = !!imageFile;
    if ((!hasText && !hasImage) || sendingMessage || !socketRef.current || connectionStatus !== 'connected') {
      return;
    }

    setSendingMessage(true);
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: hasText ? newMessage.trim() : null,
      imageUrl: imagePreview,
      createdAt: new Date().toISOString(),
      sender: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      isSending: true,
    };

    setLocalMessages((prev) => [...prev, optimisticMessage]);
    const textToSend = newMessage.trim();
    setNewMessage('');
    setImageFile(null);
    setImagePreview(null);

    try {
      let uploadedImageUrl = null;
      if (hasImage) {
        setIsUploading(true);
        const token = localStorage.getItem('adminToken');

        const sigResponse = await fetch(`${API_BASE_URL}/chat/upload-signature`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!sigResponse.ok) throw new Error('Could not get upload signature from your server.');
        const sigData = await sigResponse.json();

        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', imageFile);
        cloudinaryFormData.append('api_key', sigData.apiKey);
        cloudinaryFormData.append('timestamp', sigData.timestamp);
        cloudinaryFormData.append('signature', sigData.signature);
        cloudinaryFormData.append('folder', sigData.folder);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
        const cloudinaryResponse = await fetch(cloudinaryUrl, { method: 'POST', body: cloudinaryFormData });

        if (!cloudinaryResponse.ok) throw new Error('Cloudinary upload failed.');
        const cloudinaryResult = await cloudinaryResponse.json();
        
        uploadedImageUrl = cloudinaryResult.secure_url;
        setIsUploading(false);
      }

      const payload = {
        content: hasText ? textToSend : undefined,
        imageUrl: uploadedImageUrl,
      };

      socketRef.current.emit('sendMessage', payload, (response) => {
        if (response?.status === 'ok' && response.data) {
          setLocalMessages((prev) => prev.map((msg) => (msg.id === tempId ? response.data : msg)));
        } else {
          console.error('Failed to send message:', response?.error);
          alert(`Failed to send message: ${response?.error || 'Unknown server error'}`);
          setLocalMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, isSending: false, error: true } : msg)));
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message);
      setIsUploading(false);
      setLocalMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, isSending: false, error: true } : msg)));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditMessage = (messageId, newContent) => {
    if (!socketRef.current) return;
    socketRef.current.emit('editMessage', { messageId, content: newContent });
  };

  const handleDeleteMessage = (messageId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('deleteMessage', messageId);
  };

  const handleTyping = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('startTyping');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stopTyping');
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  const typingDisplay = Object.keys(typingUsers).filter(name => name !== currentUser?.name).join(', ');

  // --- Render Logic ---
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
      <h1 className="chat-page-title">Group Chat</h1>
      <div className="chat-container">
        <div className="groups-sidebar">
          <h3>Groups ({groups.length})</h3>
          <div className="groups-list">
            {groups.length === 0 ? (
              <div className="no-groups">
                <p>No groups available.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={`group-item ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="group-info">
                    <div className="group-name">{group.name}</div>
                    <div className="group-amir">Amir: {group.amir}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="chat-main">
          {selectedGroup ? (
            <>
              <div className="chat-header">
                <div className="chat-info">
                  <h2>{selectedGroup.name}</h2>
                  <p>Amir: {selectedGroup.amir}</p>
                </div>
                <div className={`connection-status ${connectionStatus}`}>
                  <span className="status-indicator"></span>
                  <span className="status-text">{connectionStatus}</span>
                </div>
              </div>
              <div className="messages-container">
                <div className="messages-list" ref={messagesContainerRef}>
                  {localMessages.length > 0 ? (
                    localMessages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                      />
                    ))
                  ) : (
                    <div className="no-messages-placeholder">
                      <h3>No messages yet</h3>
                      <p>Be the first to start the conversation!</p>
                    </div>
                  )}
                </div>
                <div className="typing-indicator-container">
                  {typingDisplay && <span>{typingDisplay} is typing...</span>}
                </div>
                {currentUser?.role === 'admin' && (
                  <div className="message-input-container">
                    <form onSubmit={handleSendMessage} className="message-input-form">
                      {imagePreview && (
                        <div className="image-preview-container">
                          <img src={imagePreview} alt="Selected preview" className="image-preview" />
                          <button type="button" className="remove-preview-btn" onClick={removeImagePreview}>
                            &times;
                          </button>
                        </div>
                      )}
                       <div className="input-wrapper">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          style={{ display: 'none' }}
                          accept="image/png, image/jpeg, image/gif"
                        />
                        <button
                          type="button"
                          className="btn btn-attach"
                          onClick={() => fileInputRef.current.click()}
                          disabled={sendingMessage || isUploading}
                          title="Attach an image"
                        >
                          <AttachmentIcon />
                        </button>
                        <textarea
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyDown={handleKeyPress}
                          placeholder="Type your message..."
                          className="message-input"
                          rows={1}
                          disabled={sendingMessage || isUploading}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={(!newMessage.trim() && !imageFile) || sendingMessage || isUploading}
                        >
                          {isUploading ? 'Uploading...' : sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                      {connectionStatus !== 'connected' && (
                        <div className="connection-warning">⚠️ Not connected to chat. Messages cannot be sent.</div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-group-selected">
              <h3>Select a group to start chatting</h3>
              <p>Your conversations will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;