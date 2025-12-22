import React from 'react';
import type { CalculationResult, Participant, AppAction } from '../state/types';
import './ResultsView.css';

interface ResultsViewProps {
  results: CalculationResult;
  participants: Participant[];
  dispatch: React.Dispatch<AppAction>;
  getParticipantName: (id: string) => string;
  onBack: () => void;
}

export function ResultsView({ 
  results, 
  participants, 
  dispatch: _dispatch,
  getParticipantName, 
  onBack 
}: ResultsViewProps) {
  const { balances, settlements } = results;

  const sortedBalances = participants
    .map(p => ({ ...p, balance: balances[p.id] || 0 }))
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="results-view">
      <div className="results-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Edit Events
        </button>
        <h2>✅ Settlement Results</h2>
      </div>

      {/* Net Balances Section */}
      <section className="balances-section">
        <h3>Net Balances</h3>
        <p className="section-subtitle">
          Positive = owed money | Negative = owes money
        </p>
        <div className="balances-list">
          {sortedBalances.map((p) => (
            <div 
              key={p.id} 
              className={`balance-item ${p.balance > 0 ? 'positive' : p.balance < 0 ? 'negative' : 'neutral'}`}
            >
              <span className="balance-name">{p.name}</span>
              <span className="balance-amount">
                {p.balance >= 0 ? '+' : ''}${p.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Settlement Instructions */}
      <section className="settlements-section">
        <h3>💸 Who Pays Whom</h3>
        {settlements.length === 0 ? (
          <div className="no-settlements">
            <p>🎉 Everyone is already even! No payments needed.</p>
          </div>
        ) : (
          <div className="settlements-list">
            {settlements.map((s, index) => (
              <div key={index} className="settlement-item">
                <div className="settlement-from">
                  <span className="settlement-label">From</span>
                  <span className="settlement-name">{getParticipantName(s.from)}</span>
                </div>
                <div className="settlement-arrow">
                  <span className="settlement-amount">${s.amount.toFixed(2)}</span>
                  <span className="arrow">→</span>
                </div>
                <div className="settlement-to">
                  <span className="settlement-label">To</span>
                  <span className="settlement-name">{getParticipantName(s.to)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="summary-section">
        <h3>📊 Summary</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{participants.length}</span>
            <span className="stat-label">Participants</span>
          </div>
          <div className="stat">
            <span className="stat-value">{settlements.length}</span>
            <span className="stat-label">Transactions Needed</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              ${settlements.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
            </span>
            <span className="stat-label">Total to Transfer</span>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="results-actions">
        <button onClick={onBack} className="btn btn-large btn-primary">
          ✏️ Make Changes
        </button>
        <button 
          onClick={() => window.print()} 
          className="btn btn-large btn-secondary"
        >
          🖨️ Print Results
        </button>
      </div>
    </div>
  );
}
