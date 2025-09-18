import React, { useState, useRef, useEffect } from "react";
import "./chat.css";

function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, from: "user", name: "Ahmed", text: "Assalamu alaikum!" },
    { id: 2, from: "admin", name: "Admin", text: "Wa alaikum salam. How can I help?" },
  ]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const send = () => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "admin", name: "Admin", text: text.trim() },
    ]);
    setText("");
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="page chat-page">
      <h2>Chat</h2>
      <div className="card chat-card">
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.from === "admin" ? "admin" : "user"}`}>
              <div className="meta">{m.name}</div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="composer">
          <input
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button className="btn primary" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;





