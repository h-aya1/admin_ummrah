import React, { useState } from "react";
import "./manageGroups.css";

function ManageGroups() {
  const [groups, setGroups] = useState([
    {
      id: "A",
      name: "Group A",
      members: [
        { id: 1, name: "Ahmed Ali", phone: "+966-555-111", room: "101" },
        { id: 2, name: "Sara Khan", phone: "+966-555-222", room: "102" },
      ],
    },
    {
      id: "B",
      name: "Group B",
      members: [
        { id: 3, name: "Omar Faruk", phone: "+966-555-333", room: "201" },
      ],
    },
  ]);

  const [newGroupName, setNewGroupName] = useState("");

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    setGroups((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2,7), name: newGroupName.trim(), members: [] },
    ]);
    setNewGroupName("");
  };

  const addMember = (groupId) => {
    const name = prompt("Member name");
    if (!name) return;
    const phone = prompt("Phone (optional)") || "";
    const room = prompt("Room (optional)") || "";
    setGroups((prev) => prev.map((g) => g.id === groupId ? {
      ...g,
      members: [...g.members, { id: Date.now(), name, phone, room }],
    } : g));
  };

  const removeMember = (groupId, memberId) => {
    setGroups((prev) => prev.map((g) => g.id === groupId ? {
      ...g,
      members: g.members.filter((m) => m.id !== memberId),
    } : g));
  };

  return (
    <div className="page groups-page">
      <h2>Manage Groups</h2>

      <div className="card add-group">
        <input
          placeholder="New group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button className="btn primary" onClick={addGroup}>Add Group</button>
      </div>

      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group.id} className="card group-card">
            <div className="group-header">
              <h3>{group.name}</h3>
              <button className="btn" onClick={() => addMember(group.id)}>Add member</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Room</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.phone}</td>
                    <td>{m.room}</td>
                    <td>
                      <button className="btn" onClick={() => removeMember(group.id, m.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageGroups;





