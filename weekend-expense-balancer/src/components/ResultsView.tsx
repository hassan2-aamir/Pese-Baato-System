import React, { useRef } from 'react';
import type { CalculationResult, Participant, AppAction, ExpenseEvent } from '../state/types';
import './ResultsView.css';

interface ResultsViewProps {
  results: CalculationResult;
  participants: Participant[];
  events: ExpenseEvent[];
  dispatch: React.Dispatch<AppAction>;
  getParticipantName: (id: string) => string;
  onBack: () => void;
}

export function ResultsView({
  results,
  participants,
  events,
  dispatch: _dispatch,
  getParticipantName,
  onBack,
}: ResultsViewProps) {
  const { balances, settlements, eventBalances } = results;
  const printRef = useRef<HTMLDivElement>(null);

  const sortedBalances = participants
    .map((p) => ({ ...p, balance: balances[p.id] || 0 }))
    .sort((a, b) => b.balance - a.balance);

  // Build balance sheet data
  // eventBalances[eventId][pid] = actual - expected (net per event per person)
  const balanceSheetRows = participants.map((p) => {
    const eventNets = events.map((ev) => {
      const net = eventBalances?.[ev.id]?.[p.id] ?? 0;
      return net;
    });
    const total = eventNets.reduce((s, n) => s + n, 0);
    return { participant: p, eventNets, total };
  });

  // Column sums (should be 0 for each event)
  const columnSums = events.map((_, evIdx) =>
    balanceSheetRows.reduce((s, row) => s + row.eventNets[evIdx], 0)
  );
  const grandTotal = balanceSheetRows.reduce((s, row) => s + row.total, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="results-view">
      {/* Screen-only header */}
      <div className="results-header no-print">
        <button onClick={onBack} className="btn btn-secondary">
          ← Edit Events
        </button>
        <h2>✅ Settlement Results</h2>
      </div>

      {/* ── PRINT DOCUMENT ── */}
      <div ref={printRef} className="print-document">
        {/* Print title */}
        <div className="print-title print-only">
          <h1>Expense Settlement Report</h1>
          <p className="print-date">{new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}</p>
        </div>

        {/* Net Balances Section */}
        <section className="balances-section">
          <h3>Net Balances</h3>
          <p className="section-subtitle">Positive = owed money · Negative = owes money</p>
          <div className="balances-list">
            {sortedBalances.map((p) => (
              <div
                key={p.id}
                className={`balance-item ${p.balance > 0 ? 'positive' : p.balance < 0 ? 'negative' : 'neutral'}`}
              >
                <span className="balance-name">{p.name}</span>
                <span className="balance-amount">
                  {p.balance >= 0 ? '+' : ''}₨{p.balance.toFixed(0)}
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
                    <span className="settlement-amount">₨{s.amount.toFixed(0)}</span>
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

        {/* ── BALANCE SHEET ── */}
        {events.length > 0 && participants.length > 0 && (
          <section className="balance-sheet-section">
            <h3>📊 Balance Sheet</h3>
            <p className="section-subtitle">
              Each cell = amount paid minus amount owed for that event.{' '}
              <strong className="positive-legend">Positive (+)</strong> = paid more than owed (is owed money back).{' '}
              <strong className="negative-legend">Negative (−)</strong> = paid less than owed (still owes).
              Column totals = 0 (each event balances). Row total = cumulative net per person.
            </p>
            <div className="balance-sheet-wrapper">
              <table className="balance-sheet-table">
                <thead>
                  <tr>
                    <th className="bs-col-name">Participant</th>
                    {events.map((ev) => (
                      <th key={ev.id} className="bs-col-event">
                        {ev.name}
                      </th>
                    ))}
                    <th className="bs-col-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetRows.map((row) => (
                    <tr key={row.participant.id}>
                      <td className="bs-cell-name">{row.participant.name}</td>
                      {row.eventNets.map((net, evIdx) => (
                        <td
                          key={evIdx}
                          className={`bs-cell-amount ${net > 0.5 ? 'bs-positive' : net < -0.5 ? 'bs-negative' : 'bs-zero'}`}
                        >
                          {net > 0.5 ? '+' : ''}
                          {Math.abs(net) < 0.5 ? '—' : `₨${net.toFixed(0)}`}
                        </td>
                      ))}
                      <td
                        className={`bs-cell-amount bs-total-col ${row.total > 0.5 ? 'bs-positive' : row.total < -0.5 ? 'bs-negative' : 'bs-zero'}`}
                      >
                        {row.total > 0.5 ? '+' : ''}
                        {Math.abs(row.total) < 0.5 ? '—' : `₨${row.total.toFixed(0)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bs-footer-row">
                    <td className="bs-cell-name bs-footer-label">Event Total</td>
                    {columnSums.map((sum, idx) => (
                      <td key={idx} className="bs-cell-amount bs-footer-sum">
                        {Math.abs(sum) < 0.5 ? '✓ 0' : `₨${sum.toFixed(0)}`}
                      </td>
                    ))}
                    <td className="bs-cell-amount bs-footer-sum">
                      {Math.abs(grandTotal) < 0.5 ? '✓ 0' : `₨${grandTotal.toFixed(0)}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="bs-legend">
              ✓ 0 in the Event Total row confirms the math balances — every rupee is accounted for.
            </p>
          </section>
        )}

        {/* ── PARTICIPANT RECEIPTS ── */}
        {events.length > 0 && (
          <section className="receipts-section">
            <h3>🧾 Individual Receipts</h3>
            <p className="section-subtitle">Itemized breakdown per participant across all events.</p>
            <div className="receipts-grid">
              {participants.map((p) => {
                const participantEvents = events.filter(
                  (ev) => ev.entries[p.id]?.included !== false
                );
                const totalExpected = participantEvents.reduce(
                  (s, ev) => s + (ev.entries[p.id]?.expected || 0),
                  0
                );
                const totalActual = participantEvents.reduce(
                  (s, ev) => s + (ev.entries[p.id]?.actual || 0),
                  0
                );
                const net = balances[p.id] || 0;

                return (
                  <div key={p.id} className="receipt-card">
                    <div className="receipt-header">
                      <span className="receipt-name">{p.name}</span>
                      <span
                        className={`receipt-net ${net > 0 ? 'positive' : net < 0 ? 'negative' : ''}`}
                      >
                        {net >= 0 ? '+' : ''}₨{net.toFixed(0)}
                      </span>
                    </div>
                    <div className="receipt-body">
                      {participantEvents.map((ev) => {
                        const entry = ev.entries[p.id];
                        if (!entry || !entry.included) return null;
                        const lineItems = entry.lineItems || [];
                        const evNet = entry.actual - entry.expected;

                        return (
                          <div key={ev.id} className="receipt-event">
                            <div className="receipt-event-name">{ev.name}</div>
                            {lineItems.length > 0 ? (
                              <div className="receipt-items">
                                {lineItems.map((li) => (
                                  <div key={li.id} className="receipt-item-row">
                                    <span className="ri-label">{li.label}</span>
                                    <span className="ri-amount">₨{li.amount.toFixed(0)}</span>
                                  </div>
                                ))}
                                <div className="receipt-event-subtotal">
                                  <div className="res-row">
                                    <span>Should pay</span>
                                    <span>₨{entry.expected.toFixed(0)}</span>
                                  </div>
                                  <div className="res-row">
                                    <span>Actually paid</span>
                                    <span>₨{entry.actual.toFixed(0)}</span>
                                  </div>
                                  <div className={`res-row res-net ${evNet >= 0 ? 'positive' : 'negative'}`}>
                                    <span>Net</span>
                                    <span>{evNet >= 0 ? '+' : ''}₨{evNet.toFixed(0)}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="receipt-event-subtotal">
                                <div className="res-row">
                                  <span>Should pay</span>
                                  <span>₨{entry.expected.toFixed(0)}</span>
                                </div>
                                <div className="res-row">
                                  <span>Actually paid</span>
                                  <span>₨{entry.actual.toFixed(0)}</span>
                                </div>
                                <div className={`res-row res-net ${evNet >= 0 ? 'positive' : 'negative'}`}>
                                  <span>Net</span>
                                  <span>{evNet >= 0 ? '+' : ''}₨{evNet.toFixed(0)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="receipt-footer">
                      <div className="receipt-totals">
                        <div className="rt-row">
                          <span>Total owed</span>
                          <span>₨{totalExpected.toFixed(0)}</span>
                        </div>
                        <div className="rt-row">
                          <span>Total paid</span>
                          <span>₨{totalActual.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className={`receipt-verdict ${net > 0 ? 'verdict-positive' : net < 0 ? 'verdict-negative' : 'verdict-neutral'}`}>
                        {net > 0.5
                          ? `Gets back ₨${net.toFixed(0)}`
                          : net < -0.5
                          ? `Owes ₨${Math.abs(net).toFixed(0)}`
                          : 'Settled ✓'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Summary */}
        <section className="summary-section">
          <h3>📈 Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-value">{participants.length}</span>
              <span className="stat-label">Participants</span>
            </div>
            <div className="stat">
              <span className="stat-value">{events.length}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat">
              <span className="stat-value">{settlements.length}</span>
              <span className="stat-label">Transactions</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                ₨{settlements.reduce((sum, s) => sum + s.amount, 0).toFixed(0)}
              </span>
              <span className="stat-label">Total to Transfer</span>
            </div>
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      <div className="results-actions no-print">
        <button onClick={onBack} className="btn btn-large btn-primary">
          ✏️ Make Changes
        </button>
        <button onClick={handlePrint} className="btn btn-large btn-secondary">
          🖨️ Print / Save PDF
        </button>
      </div>
    </div>
  );
}
