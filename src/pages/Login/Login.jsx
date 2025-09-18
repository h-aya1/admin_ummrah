import React, { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import toast from "react-hot-toast";
import "./login.css";

function Login() {
  const { login, loading, error } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const result = await login({ email, password });
    
    if (result.success) {
      toast.success("Login successful!");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Umrah Admin Login</h2>
          <p className="muted">Access the Umrah Guide Admin Dashboard</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@example.com"
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>
          
          <button 
            className="btn primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          
          <div className="demo-info">
            <p className="muted">Demo Credentials:</p>
            <p className="muted">Email: admin@demo.com</p>
            <p className="muted">Password: admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;


