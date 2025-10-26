// src/components/chat/MessageItem.jsx

import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

// Helper function to generate a color from a user ID
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

// Helper component to render links and tags in messages
const MessageRenderer = ({ content }) => {
  if (!content) return null;
  const regex = /(https?:\/\/[^\s]+)|(#[a-zA-Z0-9_]+)/g;
  const parts = content.split(regex).filter(Boolean);
  return (
    <div className="message-text">
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="message-link">
              {part}
            </a>
          );
        }
        if (part.match(/^#/)) {
          return (
            <span key={index} className="message-tag">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

export const MessageItem = ({ message, onEdit, onDelete }) => {
  const { currentUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');

  const isMyMessage = message.sender?.id === currentUser.id;
  const canModify = isMyMessage && !message.isDeleted;
  const userColor = getUserColor(message.sender?.id);
  const messageOpacity = message.isSending ? 0.6 : 1;

  let messageItemClass = 'message-item';
  if (message.error) messageItemClass += ' error';
  if (message.isDeleted) messageItemClass += ' deleted';

  const handleEdit = () => {
    if (!editedContent.trim()) return;
    onEdit(message.id, editedContent.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(message.content);
    }
  };

  if (message.isDeleted) {
    return (
      <div className={messageItemClass} style={{ opacity: messageOpacity }}>
        <div className="message-avatar deleted">
          <span>🗑️</span>
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="sender-name" style={{ color: userColor }}>
              {message.sender?.name || 'Unknown User'}
            </span>
            <span className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
          </div>
          <div className="deleted-message-text">
            <em>This message was deleted</em>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={messageItemClass} style={{ opacity: messageOpacity }}>
      <div className="message-avatar">
        <span>{message.sender?.name?.charAt(0) || 'U'}</span>
        <div className={`role-indicator ${message.sender?.role || 'pilgrim'}`}></div>
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name" style={{ color: userColor }}>
            {message.sender?.name || 'Unknown User'}
          </span>
          <span className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</span>
          {message.isEdited && <span className="edited-indicator">(edited)</span>}
        </div>

        {isEditing ? (
          <div className="edit-input-container">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="edit-message-input"
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={() => setIsEditing(false)}>Cancel</button>
              <button onClick={handleEdit}>Save</button>
            </div>
          </div>
        ) : (
          <>
            {message.imageUrl && (
              <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={message.imageUrl} alt="Chat attachment" className="message-image" />
              </a>
            )}
            <MessageRenderer content={message.content} />
          </>
        )}

        {message.error && <span className="send-error-indicator">Failed to send</span>}
      </div>

      {canModify && !isEditing && (
        <div className="message-actions">
          <button onClick={() => setIsEditing(true)}>✏️</button>
          <button onClick={handleDelete}>🗑️</button>
        </div>
      )}
    </div>
  );
};