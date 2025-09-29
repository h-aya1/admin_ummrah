import { useState, useEffect, useRef } from "react"
import { useAppContext } from "../../contexts/AppContext"
import "./chat.css"

const Chat = () => {
  const { groups, messages, addMessage, users } = useAppContext()
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  // Core messaging state
  const [wsConnection, setWsConnection] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [currentUser] = useState({ id: 0, name: "Admin", role: "admin" })

  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadMessages(selectedGroup.id)
      connectToGroupChat(selectedGroup.id)
    }
    return () => {
      disconnectFromChat()
    }
  }, [selectedGroup])

  // WebSocket connection effect
  useEffect(() => {
    return () => {
      disconnectFromChat()
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadGroups = async () => {
    setLoading(true)

    // Groups are already loaded by AppContext
    if (groups.length > 0) {
      setSelectedGroup(groups[0])
    }

    setLoading(false)
  }

  const loadMessages = async (groupId) => {
    // Messages are now managed by the context
    // No need to set local state - messages come from context
  }

  // Removed unnecessary analytics functions

  // ============ WEBSOCKET AND API FUNCTIONS ============
  
  /**
   * Mock WebSocket connection for real-time chat
   * In production, this would connect to: ws://localhost:3001/chat/:groupId
   */
  const connectToGroupChat = (groupId) => {
    disconnectFromChat() // Close any existing connection
    
    try {
      setConnectionStatus('connecting')
      
      // Mock WebSocket connection - replace with actual WebSocket in production
      // const ws = new WebSocket(`ws://localhost:3001/chat/${groupId}`)
      
      // For now, simulate WebSocket with mock connection
      const mockWs = {
        readyState: 1, // OPEN
        send: (data) => {
          console.log('Mock WebSocket sending:', data)
          // In production, this would send to actual WebSocket server
        },
        close: () => {
          console.log('Mock WebSocket closed')
          setConnectionStatus('disconnected')
        },
        addEventListener: (event, handler) => {
          if (event === 'open') {
            setTimeout(() => {
              setConnectionStatus('connected')
              handler()
            }, 500)
          }
        }
      }
      
      wsRef.current = mockWs
      setWsConnection(mockWs)
      
      // Simulate connection opening
      mockWs.addEventListener('open', () => {
        console.log(`Connected to group chat: ${groupId}`)
        setConnectionStatus('connected')
      })
      
      // In production, add these event listeners:
      /*
      ws.addEventListener('message', (event) => {
        const messageData = JSON.parse(event.data)
        handleNewMessage(messageData)
      })
      
      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      })
      
      ws.addEventListener('close', () => {
        console.log('WebSocket connection closed')
        setConnectionStatus('disconnected')
      })
      */
      
    } catch (error) {
      console.error('Failed to connect to chat:', error)
      setConnectionStatus('error')
    }
  }
  
  const disconnectFromChat = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setWsConnection(null)
      setConnectionStatus('disconnected')
    }
  }

  /**
   * Mock API function to send a message
   * POST /messages
   */
  const sendMessage = async (messageText, messageType = 'text') => {
    if (!selectedGroup || !messageText.trim()) return
    
    // Check if user has permission to send messages
    if (!canSendMessage()) {
      alert('Only admin and group leaders (amir) can send messages. Regular members can only view messages.')
      return
    }
    
    setSendingMessage(true)
    
    try {
      // Mock API call - replace with actual API in production
      const messageData = {
        groupId: selectedGroup.id,
        message: messageText.trim(),
        type: messageType,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role
      }
      
      console.log('Sending message via API:', messageData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // In production, make actual API call:
      /*
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(messageData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const result = await response.json()
      */
      
      // Mock successful response
      const newMessage = {
        id: Date.now(),
        groupId: selectedGroup.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        message: messageText.trim(),
        timestamp: new Date(),
        type: messageType,
        flagged: false,
        sentiment: 'neutral',
        readBy: 1,
        reactions: {},
        edited: false,
        priority: messageType === 'announcement' ? 'high' : 'normal',
      }
      
      // Add message to context (this will automatically update localStorage and trigger stats update)
      addMessage({
        groupId: selectedGroup.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        message: messageText.trim(),
        type: messageType,
      })

      setNewMessage('')
      
      // Send via WebSocket for real-time delivery
      if (wsConnection && wsConnection.readyState === 1) {
        wsConnection.send(JSON.stringify(newMessage))
      }
      
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }
  
  // Removed pagination function for minimal UI
  
  // ============ UTILITY FUNCTIONS ============
  
  const canSendMessage = () => {
    // Only admin and group leaders (amir) can send messages
    // Members cannot send messages at all
    return currentUser.role === 'admin' || 
           (currentUser.role === 'amir' && selectedGroup?.amir === currentUser.name)
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim() && !sendingMessage) {
      sendMessage(newMessage)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Simplified message display - no filtering needed for minimal UI

  // Removed moderation functions for minimal UI

  const handleSendAnnouncement = () => {
    const announcement = prompt("Enter announcement message:")
    if (announcement && selectedGroup) {
      sendMessage(`📢 ANNOUNCEMENT: ${announcement}`, 'announcement')
    }
  }

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chat data...</p>
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="page-header">
        <h1>Group Chat</h1>
        {selectedGroup && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleSendAnnouncement}>
              📢 Send Announcement
            </button>
          </div>
        )}
      </div>

      <div className="chat-container">
        <div className="groups-sidebar">
          <h3>Groups ({groups.length})</h3>
          {groups.length === 0 ? (
            <div className="no-groups">
              <p>No groups available. Create groups in the Manage Groups section.</p>
            </div>
          ) : (
            <div className="groups-list">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`group-item ${selectedGroup?.id === group.id ? "selected" : ""}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="group-info">
                    <div className="group-name">{group.name}</div>
                    <div className="group-amir">Amir: {group.amir}</div>
                    <div className="group-members">
                      {group.totalMembers || 0} members
                    </div>
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
                    <span className="status-text">
                      {connectionStatus === 'connected' && 'Connected'}
                      {connectionStatus === 'connecting' && 'Connecting...'}
                      {connectionStatus === 'disconnected' && 'Disconnected'}
                      {connectionStatus === 'error' && 'Connection Error'}
                    </span>
                  </div>
                  <p>Amir: {selectedGroup.amir} • {selectedGroup.totalMembers || 0} members</p>
                </div>
              </div>

              <div className="messages-container">
                <div className="messages-list">
                  {messages
                    .filter(message => message.groupId === selectedGroup?.id)
                    .map((message) => (
                    <div key={message.id} className={`message-item ${message.type}`}>
                      <div className="message-avatar">
                        <span>{message.senderName.charAt(0)}</span>
                        <div className={`role-indicator ${message.senderRole}`}></div>
                      </div>

                      <div className="message-content">
                        <div className="message-header">
                          <span className="sender-name">{message.senderName}</span>
                          <span className={`sender-role ${message.senderRole}`}>{message.senderRole}</span>
                          <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className={`message-text ${message.type}`}>{message.message}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input Component */}
                {canSendMessage() && (
                  <div className="message-input-container">
                    <form onSubmit={handleSendMessage} className="message-input-form">
                      <div className="input-wrapper">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message... (Enter to send)"
                          className="message-input"
                          rows={2}
                          disabled={sendingMessage || connectionStatus !== 'connected'}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!newMessage.trim() || sendingMessage || connectionStatus !== 'connected'}
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                      {connectionStatus !== 'connected' && (
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
              <p>Choose a group from the sidebar to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
