import React, { useState } from 'react';
import type { ExpenseEvent, Participant, AppAction } from '../state/types';
import './EventCard.css';

interface EventCardProps {
  event: ExpenseEvent;
  participants: Participant[];
  dispatch: React.Dispatch<AppAction>;
}

interface LineItemInputProps {
  eventId: string;
  participantId: string;
  dispatch: React.Dispatch<AppAction>;
}

function LineItemInput({ eventId, participantId, dispatch }: LineItemInputProps) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    dispatch({
      type: 'ADD_LINE_ITEM',
      eventId,
      participantId,
      label: label.trim() || 'Item',
      amount: amt,
    });
    setLabel('');
    setAmount('');
  };

  return (
    <div className="line-item-input">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Item (e.g. Chai)"
        className="line-item-label-input"
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="₨"
        className="line-item-amount-input"
        min="0"
        step="1"
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
      />
      <button onClick={handleAdd} className="btn btn-small btn-add-item" title="Add item">
        +
      </button>
    </div>
  );
}

export function EventCard({ event, participants, dispatch }: EventCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(event.name);
  const [splitTotal, setSplitTotal] = useState('');
  const [selectedPayer, setSelectedPayer] = useState(participants[0]?.id || '');
  const [expandedLineItems, setExpandedLineItems] = useState<Record<string, boolean>>({});

  const handleEntryChange = (
    participantId: string,
    field: 'expected' | 'actual',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    dispatch({
      type: 'UPDATE_EVENT_ENTRY',
      eventId: event.id,
      participantId,
      field,
      value: numValue,
    });
  };

  const handleToggleInclude = (participantId: string, currentlyIncluded: boolean) => {
    if (currentlyIncluded) {
      dispatch({ type: 'EXCLUDE_PARTICIPANT', eventId: event.id, participantId });
    } else {
      dispatch({ type: 'INCLUDE_PARTICIPANT', eventId: event.id, participantId });
    }
  };

  const handleSplitEqually = () => {
    const total = parseFloat(splitTotal) || 0;
    if (total > 0) {
      dispatch({ type: 'SPLIT_EQUALLY', eventId: event.id, total });
      setSplitTotal('');
    }
  };

  const handleSinglePayer = () => {
    const total = Object.values(event.entries).reduce((sum, e) => sum + e.expected, 0);
    if (selectedPayer && total > 0) {
      dispatch({ type: 'SET_SINGLE_PAYER', eventId: event.id, payerId: selectedPayer, total });
    }
  };

  const handleRemoveEvent = () => {
    dispatch({ type: 'REMOVE_EVENT', id: event.id });
  };

  const saveEventName = () => {
    if (editName.trim()) {
      dispatch({ type: 'UPDATE_EVENT_NAME', id: event.id, name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const toggleLineItems = (pid: string) => {
    setExpandedLineItems((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  const getTotalExpected = () =>
    Object.values(event.entries).reduce((sum, e) => sum + e.expected, 0);

  const getTotalActual = () =>
    Object.values(event.entries).reduce((sum, e) => sum + e.actual, 0);

  return (
    <div className="event-card">
      <div className="event-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="event-title-section">
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveEventName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEventName();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="event-name-input"
              autoFocus
            />
          ) : (
            <h3
              className="event-name"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              {event.name} <span className="edit-hint">✎</span>
            </h3>
          )}
          <span className="event-summary">
            Expected: ₨{getTotalExpected().toFixed(0)} | Paid: ₨{getTotalActual().toFixed(0)}
          </span>
        </div>
        <div className="event-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveEvent();
            }}
            className="btn btn-small btn-danger"
            title="Remove event"
          >
            🗑
          </button>
          <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="event-body">
          {/* Shortcuts Bar */}
          <div className="shortcuts-bar">
            <div className="shortcut-group">
              <input
                type="number"
                value={splitTotal}
                onChange={(e) => setSplitTotal(e.target.value)}
                placeholder="Total amount"
                className="shortcut-input"
                min="0"
                step="1"
              />
              <button onClick={handleSplitEqually} className="btn btn-small btn-secondary">
                Split Equally
              </button>
            </div>
            <div className="shortcut-group">
              <select
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
                className="shortcut-select"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button onClick={handleSinglePayer} className="btn btn-small btn-secondary">
                Paid All
              </button>
            </div>
          </div>

          {/* Participant Entries */}
          <div className="entries-table">
            <div className="entries-header">
              <span className="col-name">Participant</span>
              <span className="col-expected">Should Pay</span>
              <span className="col-actual">Actually Paid</span>
              <span className="col-balance">Balance</span>
            </div>
            {participants.map((p) => {
              const entry = event.entries[p.id] || {
                expected: 0,
                actual: 0,
                included: true,
                lineItems: [],
              };
              const balance = entry.actual - entry.expected;
              const isIncluded = entry.included;
              const lineItems = entry.lineItems || [];
              const hasLineItems = lineItems.length > 0;
              const isExpanded = expandedLineItems[p.id];

              return (
                <div key={p.id} className="entry-block">
                  <div className={`entry-row ${!isIncluded ? 'excluded' : ''}`}>
                    <span className="col-name">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => handleToggleInclude(p.id, isIncluded)}
                        className="include-checkbox"
                        title={isIncluded ? 'Exclude from event' : 'Include in event'}
                      />
                      <span className={!isIncluded ? 'excluded-name' : ''}>{p.name}</span>
                    </span>
                    <span className="col-expected">
                      <div className="expected-cell">
                        <input
                          type="number"
                          value={entry.expected || ''}
                          onChange={(e) => handleEntryChange(p.id, 'expected', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="1"
                          className={`amount-input ${hasLineItems ? 'has-items' : ''}`}
                          disabled={!isIncluded}
                          title={hasLineItems ? 'Total from itemized entries' : ''}
                          readOnly={hasLineItems}
                        />
                        {isIncluded && (
                          <button
                            className={`btn-items-toggle ${isExpanded ? 'active' : ''} ${hasLineItems ? 'has-items' : ''}`}
                            onClick={() => toggleLineItems(p.id)}
                            title={isExpanded ? 'Hide items' : 'Add items'}
                          >
                            {hasLineItems ? `${lineItems.length} items` : '+ items'}
                          </button>
                        )}
                      </div>
                    </span>
                    <span className="col-actual">
                      <input
                        type="number"
                        value={entry.actual || ''}
                        onChange={(e) => handleEntryChange(p.id, 'actual', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="amount-input"
                        disabled={!isIncluded}
                      />
                    </span>
                    <span
                      className={`col-balance ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : ''}`}
                    >
                      {balance >= 0 ? '+' : ''}
                      {balance.toFixed(0)}
                    </span>
                  </div>

                  {/* Line items panel */}
                  {isIncluded && isExpanded && (
                    <div className="line-items-panel">
                      {lineItems.length > 0 && (
                        <div className="line-items-list">
                          {lineItems.map((li) => (
                            <div key={li.id} className="line-item-row">
                              <span className="li-label">{li.label}</span>
                              <span className="li-amount">₨{li.amount.toFixed(0)}</span>
                              <button
                                className="btn-remove-item"
                                onClick={() =>
                                  dispatch({
                                    type: 'REMOVE_LINE_ITEM',
                                    eventId: event.id,
                                    participantId: p.id,
                                    lineItemId: li.id,
                                  })
                                }
                                title="Remove item"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <div className="line-items-total">
                            <span>Total</span>
                            <span>₨{entry.expected.toFixed(0)}</span>
                          </div>
                        </div>
                      )}
                      <LineItemInput
                        eventId={event.id}
                        participantId={p.id}
                        dispatch={dispatch}
                      />
                      <p className="line-items-hint">
                        Items auto-sum into "Should Pay". Press Enter or click + to add.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
