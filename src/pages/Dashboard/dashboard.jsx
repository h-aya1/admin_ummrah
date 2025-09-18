import React, { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { analyticsAPI, groupsAPI, usersAPI } from "../../services/api";
import toast from "react-hot-toast";
import "./dashboard.css";

function StatCard({ title, value, subtitle, icon, trend, color = "primary" }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <div className="stat-value">{value}</div>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stat-title">{title}</div>
      <div className="stat-sub">{subtitle}</div>
    </div>
  );
}

function Dashboard() {
  const { dashboardStats, groups, users } = useApp();
  const [loading, setLoading] = useState(true);
  const [recentGroups, setRecentGroups] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load groups and users data
      const [groupsRes, usersRes] = await Promise.all([
        groupsAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      setRecentGroups(groupsRes.data.slice(0, 5));
      setRecentUsers(usersRes.data.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = users.length || 0;
  const activeGroups = groups.filter(g => g.status === 'active').length || 0;
  const totalDuas = 0; // This would come from API
  const totalPlaces = 0; // This would come from API

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <div className="dashboard-actions">
          <button className="btn" onClick={loadDashboardData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Users" 
          value={totalUsers.toLocaleString()} 
          subtitle="Registered pilgrims" 
          icon="👥"
          trend={12}
          color="blue"
        />
        <StatCard 
          title="Active Groups" 
          value={activeGroups} 
          subtitle="Currently active" 
          icon="🏘️"
          trend={8}
          color="green"
        />
        <StatCard 
          title="Duas Available" 
          value={totalDuas} 
          subtitle="Prayers & supplications" 
          icon="📜"
          color="purple"
        />
        <StatCard 
          title="Visit Places" 
          value={totalPlaces} 
          subtitle="Sacred locations" 
          icon="📍"
          color="orange"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <h3>Recent Groups</h3>
            <div className="panel-actions">
              <button className="btn small">View All</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>Amir</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentGroups.map((group, i) => (
                  <tr key={group.id || i}>
                    <td>{group.name || `Group ${i + 1}`}</td>
                    <td>{group.amir?.name || "Not assigned"}</td>
                    <td>{group.members?.length || 0}</td>
                    <td>
                      <span className={`status ${group.status || 'active'}`}>
                        {group.status || 'Active'}
                      </span>
                    </td>
                    <td>{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
                {recentGroups.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-data">No groups found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Recent Users</h3>
            <div className="panel-actions">
              <button className="btn small">View All</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Group</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, i) => (
                  <tr key={user.id || i}>
                    <td>{user.name || `User ${i + 1}`}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.group?.name || 'No group'}</td>
                    <td>{user.role || 'Pilgrim'}</td>
                    <td>
                      <span className={`status ${user.status || 'active'}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-data">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">
            <span className="icon">👥</span>
            <span>Create Group</span>
          </button>
          <button className="action-btn">
            <span className="icon">📢</span>
            <span>Send Announcement</span>
          </button>
          <button className="action-btn">
            <span className="icon">📍</span>
            <span>Add Place</span>
          </button>
          <button className="action-btn">
            <span className="icon">📜</span>
            <span>Add Dua</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;





