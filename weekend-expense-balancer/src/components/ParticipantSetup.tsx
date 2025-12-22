import React, { useState } from 'react';
import type { Participant, AppAction } from '../state/types';
import './ParticipantSetup.css';

interface ParticipantSetupProps {
  participants: Participant[];
  dispatch: React.Dispatch<AppAction>;
  onContinue: () => void;
}

export function ParticipantSetup({ participants, dispatch, onContinue }: ParticipantSetupProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      dispatch({ type: 'ADD_PARTICIPANT', name: newName.trim() });
      setNewName('');
    }
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', id });
  };

  const startEditing = (participant: Participant) => {
    setEditingId(participant.id);
    setEditName(participant.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      dispatch({ type: 'UPDATE_PARTICIPANT', id: editingId, name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="participant-setup">
      <h2>👥 Add Participants</h2>
      <p className="subtitle">Who's splitting expenses on this trip?</p>

      <form onSubmit={handleAddParticipant} className="add-form">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter name..."
          className="name-input"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
          + Add
        </button>
      </form>

      {participants.length > 0 && (
        <ul className="participant-list">
          {participants.map((p) => (
            <li key={p.id} className="participant-item">
              {editingId === p.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="edit-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <button onClick={saveEdit} className="btn btn-small btn-success">✓</button>
                  <button onClick={cancelEdit} className="btn btn-small btn-secondary">✕</button>
                </div>
              ) : (
                <>
                  <span className="participant-name">{p.name}</span>
                  <div className="participant-actions">
                    <button onClick={() => startEditing(p)} className="btn btn-small btn-secondary">✎</button>
                    <button onClick={() => handleRemove(p.id)} className="btn btn-small btn-danger">🗑</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {participants.length === 0 && (
        <div className="empty-state">
          <p>No participants yet. Add at least 2 people to continue.</p>
        </div>
      )}

      <div className="actions">
        <button
          onClick={onContinue}
          className="btn btn-large btn-primary"
          disabled={participants.length < 2}
        >
          Continue to Events →
        </button>
      </div>
    </div>
  );
}
