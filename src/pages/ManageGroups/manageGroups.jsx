import { useState, useEffect } from "react"
import { useAppContext } from "../../contexts/AppContext"
import "./manageGroups.css"

// Simple Toast component
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#333', color: '#fff', padding: '12px 24px', borderRadius: 8, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      {message}
    </div>
  )
}


const ManageGroups = () => {
  const { users, groups, addUser, updateUser, deleteUser, addGroup, updateGroup, deleteGroup, addActivity } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("groups")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [newUserPassword, setNewUserPassword] = useState("")
  const [toastMsg, setToastMsg] = useState("")

  // Load data on component mount
  useEffect(() => {
    // Data is already loaded by AppContext
    setLoading(false)
  }, [])

  // Save users and groups to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("ummrah_users", JSON.stringify(users))
      localStorage.setItem("ummrah_groups", JSON.stringify(groups))
    }
  }, [users, groups, loading])

  // Listen for external updates (e.g. AddMemberSection) and reload
  useEffect(() => {
    const onDataUpdated = () => {
      const storedUsers = localStorage.getItem("ummrah_users")
      const storedGroups = localStorage.getItem("ummrah_groups")
      if (storedUsers) setUsers(JSON.parse(storedUsers))
      if (storedGroups) {
        const parsedGroups = JSON.parse(storedGroups)
        setGroups(parsedGroups)
        // If a group modal is open, refresh its data from the updated groups
        setSelectedGroup((prev) => {
          if (!prev) return prev
          const refreshed = parsedGroups.find((g) => g.id === prev.id)
          return refreshed || prev
        })
      }
    }

    window.addEventListener("dataUpdated", onDataUpdated)
    return () => window.removeEventListener("dataUpdated", onDataUpdated)
  }, [])

  const handleAddItem = () => {
    setEditingItem(null)
    setShowAddModal(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowAddModal(true)
  }

  const handleDeleteItem = (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === "group") {
        deleteGroup(id)
        setToastMsg("Group deleted")
      } else {
        deleteUser(id)
        setToastMsg("User deleted from system")
      }
    }
  }

  const handleUpdateGroup = (updatedGroup) => {
    updateGroup(updatedGroup.id, updatedGroup)
    setSelectedGroup(updatedGroup)
  }

  const handleAssignUserToGroup = (userId, groupId, groupName) => {
    updateUser(userId, { groupId, groupName })
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="manage-groups-page">
      <div className="page-header">
        <h1>Manage Groups & Users</h1>
        <div className="header-actions">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === "groups" ? "active" : ""}`}
              onClick={() => setActiveTab("groups")}
            >
              Groups
            </button>
            <button 
              className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleAddItem}>
            Add New {activeTab === "groups" ? "Group" : "User"}
          </button>
        </div>
      </div>

      <div className="page-content">
        {activeTab === "groups" ? (
          <GroupsView 
            groups={groups} 
            onEdit={handleEditItem} 
            onDelete={(id) => handleDeleteItem(id, "group")}
            onView={setSelectedGroup}
          />
        ) : (
          <UsersView 
            users={users} 
            onEdit={handleEditItem} 
            onDelete={(id) => handleDeleteItem(id, "user")}
          />
        )}
      </div>

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          users={users}
          onUpdateGroup={handleUpdateGroup}
          onAssignUser={handleAssignUserToGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {showAddModal && (
        <ItemModal
          type={activeTab === "groups" ? "group" : "user"}
          item={editingItem}
          groups={groups}
          users={users}
          onClose={() => setShowAddModal(false)}
          onSave={(itemData) => {
            if (activeTab === "groups") {
              if (editingItem) {
                updateGroup(editingItem.id, itemData)
              } else {
                const newGroup = addGroup(itemData)
                // The addGroup function already handles updating the amir user's group assignment
              }
            } else {
              if (editingItem) {
                updateUser(editingItem.id, itemData)
              } else {
                const newUser = addUser(itemData)
                setNewUserPassword(newUser.password)
              }
            }
            setShowAddModal(false)
          }}
        />
      )}

      {newUserPassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>User Password Generated</h2>
              <button className="close-btn" onClick={() => setNewUserPassword("")}>×</button>
            </div>
            <div className="modal-body">
              <p>
                The password for the new user is: <strong>{newUserPassword}</strong>
              </p>
              <p>Please share this password with the user for their first login.</p>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  )
}

const GroupsView = ({ groups, onEdit, onDelete, onView }) => {
  return (
    <div className="groups-grid">
      {groups.map((group) => (
        <div key={group.id} className="group-card">
          <div className="group-header">
            <div className="group-info">
              <h3 className="group-name">{group.name}</h3>
              <p className="group-amir">Amir: {group.amir}</p>
            </div>
            <div className="group-actions">
              <button className="action-btn view" onClick={() => onView(group)}>
                👁️
              </button>
              <button className="action-btn edit" onClick={() => onEdit(group)}>
                ✏️
              </button>
              <button className="action-btn delete" onClick={() => onDelete(group.id)}>
                🗑️
              </button>
            </div>
          </div>

          <div className="group-stats">
            <div className="stat">
              <span className="stat-value">{group.totalMembers}</span>
              <span className="stat-label">Total Members</span>
            </div>
            <div className="stat">
              <span className="stat-value">{group.activeMembers}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>

          <div className="group-meta">
            <div className="meta-item">
              <span className="meta-icon">📍</span>
              <span className="meta-text">{group.location}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🕐</span>
              <span className="meta-text">Last activity: {new Date(group.lastActivity).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="group-footer">
            <span className="created-date">Created: {group.createdAt}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const UsersView = ({ users, onEdit, onDelete }) => {
  // Copy password to clipboard
  const handleCopyPassword = (password) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(password)
        .then(() => {
          alert("Password copied to clipboard!")
        })
        .catch(() => {
          alert("Failed to copy password.")
        })
    }
  }

  return (
    <div className="users-table-container">
      <table className="table users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Group</th>
            <th>Location</th>
            <th>Password</th>
            <th>Last Seen</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-info">
                  <div className="user-avatar">{user.name.charAt(0)}</div>
                  <div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </td>
              <td>{user.groupName}</td>
              <td>
                <div className="location-info">
                  <span className="location-address">{user.location?.address || "N/A"}</span>
                </div>
              </td>
              <td>
                {user.password ? (
                  <>
                    <span className="user-password">{user.password}</span>
                    <button
                      className="action-btn copy"
                      style={{ marginLeft: "8px" }}
                      title="Copy password"
                      onClick={() => handleCopyPassword(user.password)}
                    >
                      📋
                    </button>
                  </>
                ) : "-"}
              </td>
              <td>{user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "N/A"}</td>
              <td>
                <div className="table-actions">
                  <button className="action-btn edit" onClick={() => onEdit(user)}>
                    ✏️
                  </button>
                  <button className="action-btn delete" onClick={() => onDelete(user.id)}>
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// AddMemberSection component
const AddMemberSection = ({ group, users, onAssignUser, onUpdateGroup }) => {
  const members = Array.isArray(group?.members) ? group.members : []
  // Filter out users who are already members (including the amir who is auto-added)
  const available = users.filter((u) => !members.some((m) => m.id === u.id))
  const [selectedUserId, setSelectedUserId] = useState(available.length ? String(available[0].id) : '')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    // when users or group changes, update the selected user id
    setSelectedUserId(available.length ? String(available[0].id) : '')
  }, [group?.id, users.length])

  const handleAdd = () => {
    const uid = typeof selectedUserId === 'string' ? Number(selectedUserId) : selectedUserId
    const user = users.find((u) => u.id === uid)
    if (!user) {
      setToastMsg('Select a valid user')
      return
    }

    const newMember = { id: user.id, name: user.name, phone: user.phone }

    const updatedGroup = { ...group }
    updatedGroup.members = Array.isArray(updatedGroup.members) ? [...updatedGroup.members] : []
    updatedGroup.members.push(newMember)
    updatedGroup.totalMembers = updatedGroup.totalMembers ? updatedGroup.totalMembers + 1 : updatedGroup.members.length

    // inform parent to update group state
    if (typeof onUpdateGroup === 'function') onUpdateGroup(updatedGroup)

    // inform parent to assign user to group
    if (typeof onAssignUser === 'function') onAssignUser(user.id, updatedGroup.id, updatedGroup.name)

    setToastMsg(`${user.name} added to ${group.name}`)
  }

  return (
    <div className="add-member-section">
      <h4 className="add-member-title">Add Member</h4>
      {available.length === 0 ? (
        <div className="no-users-message">No available users to add</div>
      ) : (
        <div className="add-member-form">
          <select 
            className="member-select" 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select a user...</option>
            {available.map(u => (
              <option key={u.id} value={u.id}>{u.name} - {u.phone}</option>
            ))}
          </select>
          <button className="btn btn-primary add-member-btn" onClick={handleAdd}>
            Add Member
          </button>
        </div>
      )}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  )
}

const GroupDetailModal = ({ group, onClose, users = [], onUpdateGroup, onAssignUser }) => {
  const members = Array.isArray(group?.members) ? group.members : []
  const totalMembers = members.length
  const lastActivity = group?.lastActivity ? new Date(group.lastActivity).toLocaleString() : "N/A"

  // Remove member handler
  const handleRemoveMember = (memberId) => {
    const updatedGroup = { ...group }
    updatedGroup.members = Array.isArray(updatedGroup.members)
      ? updatedGroup.members.filter((m) => m.id !== memberId)
      : []
    updatedGroup.totalMembers = updatedGroup.members.length
    if (typeof onUpdateGroup === "function") onUpdateGroup(updatedGroup)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{group?.name || "Group Details"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="group-detail">
          <div className="group-overview">
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-number">{totalMembers}</span>
                <span className="stat-text">Total Members</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{activeMembers}</span>
                <span className="stat-text">Active Members</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{offlineMembers}</span>
                <span className="stat-text">Offline</span>
              </div>
            </div>
            <div className="group-info-detail">
              <div className="info-item">
                <strong>Amir:</strong> {group?.amir || "-"}
              </div>
              <div className="info-item">
                <strong>Current Location:</strong> {group?.location || "-"}
              </div>
              <div className="info-item">
                <strong>Created:</strong> {group?.createdAt || "-"}
              </div>
              <div className="info-item">
                <strong>Last Activity:</strong> {lastActivity}
              </div>
            </div>
          </div>
          <div className="members-section">
            <h3>Group Members</h3>
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="member-avatar">{member.name?.charAt(0) || "U"}</div>
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-meta">
                        <span className={`role-badge ${member.role}`}>{member.role}</span>
                      </div>
                    </div>
                    <div className="member-joined">Joined: {member.joinedAt || "-"}</div>
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ marginLeft: 12 }}
                    title="Remove member"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {/* Add member form */}
            <AddMemberSection group={group} users={users} onAssignUser={onAssignUser} onUpdateGroup={onUpdateGroup} />
          </div>
        </div>
      </div>
    </div>
  )
}


const ItemModal = ({ type, item, groups, users = [], onClose, onSave }) => {
  // Ensure users is always defined
  users = users || []
  const [formData, setFormData] = useState(
    type === "group"
      ? {
          name: item?.name || "",
          amir: item?.amir || "",
        }
      : {
          name: item?.name || "",
          phone: item?.phone || "",
          email: item?.email || "",
          role: item?.role || "member",
          emergencyContact: item?.emergencyContact || "",
        },
  )
  // Only users with role 'amir' for group leader selection
  const amirUsers = users.filter(u => u.role === "amir")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (type === "user") {
      const selectedGroup = groups.find((g) => g.id === Number.parseInt(formData.groupId))
      formData.groupName = selectedGroup?.name || ""
      // Phone is required, email is optional
      if (!formData.phone) {
        alert("Phone number is required.")
        return
      }
    }
    if (type === "group") {
      // Amir must be selected from users list
      if (!formData.amir) {
        alert("Please select an Amir (Group Leader) from the users list.")
        return
      }
      const amirExists = users.some((u) => u.name === formData.amir)
      if (!amirExists) {
        alert("Selected Amir is not in the users list.")
        return
      }
    }
    onSave(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {item ? "Edit" : "Add New"} {type === "group" ? "Group" : "User"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="item-form">
          {type === "group" ? (
            <>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Amir (Group Leader)</label>
                <select
                  name="amir"
                  value={formData.amir}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Select Amir from users...</option>
                  {amirUsers.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
                {amirUsers.length === 0 && (
                  <small style={{ color: "#888" }}>
                    No users with role 'Amir' available. Please add an Amir user first.
                  </small>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="input">
                  <option value="member">Member</option>
                  <option value="amir">Amir</option>
                </select>
              </div>

              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? "Update" : "Add"} {type === "group" ? "Group" : "User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManageGroups
