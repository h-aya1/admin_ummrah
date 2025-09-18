import React, { useState } from "react";
import { useApp } from "../../contexts/AppContext";

function Notifications() {
  const { notifications, setNotifications } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const send = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setNotifications((prev) => [
      { id: Date.now().toString(), title: title.trim(), body: body.trim(), type: "custom", timestamp: new Date().toISOString(), read: false },
      ...prev,
    ]);
    setTitle("");
    setBody("");
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="page notifications-page">
      <div className="page-header">
        <h2>Notifications</h2>
        <button className="btn" onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="card">
        <form onSubmit={send} className="form">
          <label>Title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Announcement title" />
          <label>Body</label>
          <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Write your message..." />
          <div className="actions">
            <button className="btn" type="reset" onClick={()=>{setTitle(""); setBody("");}}>Clear</button>
            <button className="btn primary" type="submit">Send</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>History</h3>
        {notifications.length === 0 && <div className="muted">No notifications yet.</div>}
        <ul className="list">
          {notifications.map((n) => (
            <li key={n.id} className={`list-item ${n.read ? "" : "unread"}`}>
              <div className="title">{n.title}</div>
              <div className="subtitle">{n.body}</div>
              <div className="meta">{new Date(n.timestamp).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Notifications;


