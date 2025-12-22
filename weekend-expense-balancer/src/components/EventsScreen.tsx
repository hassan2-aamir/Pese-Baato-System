import React, { useState } from 'react';
import type { ExpenseEvent, Participant, AppAction } from '../state/types';
import { EventCard } from './EventCard';
import './EventsScreen.css';

interface EventsScreenProps {
  events: ExpenseEvent[];
  participants: Participant[];
  dispatch: React.Dispatch<AppAction>;
  onBack: () => void;
  onCalculate: () => void;
}

export function EventsScreen({ 
  events, 
  participants, 
  dispatch, 
  onBack, 
  onCalculate 
}: EventsScreenProps) {
  const [newEventName, setNewEventName] = useState('');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newEventName.trim() || `Event ${events.length + 1}`;
    dispatch({ type: 'ADD_EVENT', name });
    setNewEventName('');
  };

  const quickAddEvent = (name: string) => {
    dispatch({ type: 'ADD_EVENT', name });
  };

  return (
    <div className="events-screen">
      <div className="events-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Participants
        </button>
        <h2>📝 Add Expenses</h2>
      </div>

      <div className="participants-badge">
        <strong>Participants:</strong> {participants.map(p => p.name).join(', ')}
      </div>

      <div className="add-event-section">
        <form onSubmit={handleAddEvent} className="add-event-form">
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder="Event name (e.g., Lunch, Taxi, Hotel)"
            className="event-name-input"
          />
          <button type="submit" className="btn btn-primary">
            + Add Event
          </button>
        </form>

        <div className="quick-add">
          <span>Quick add:</span>
          <button onClick={() => quickAddEvent('Lunch')} className="btn btn-small btn-outline">🍽 Lunch</button>
          <button onClick={() => quickAddEvent('Dinner')} className="btn btn-small btn-outline">🍕 Dinner</button>
          <button onClick={() => quickAddEvent('Transport')} className="btn btn-small btn-outline">🚕 Transport</button>
          <button onClick={() => quickAddEvent('Hotel')} className="btn btn-small btn-outline">🏨 Hotel</button>
          <button onClick={() => quickAddEvent('Activity')} className="btn btn-small btn-outline">🎯 Activity</button>
        </div>
      </div>

      <div className="events-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No events yet. Add your first expense!</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              participants={participants}
              dispatch={dispatch}
            />
          ))
        )}
      </div>

      <div className="calculate-section">
        <button 
          onClick={onCalculate} 
          className="btn btn-large btn-success calculate-btn"
          disabled={events.length === 0}
        >
          🧮 Calculate Settlement
        </button>
        {events.length === 0 && (
          <p className="calculate-hint">Add at least one event to calculate</p>
        )}
      </div>
    </div>
  );
}
