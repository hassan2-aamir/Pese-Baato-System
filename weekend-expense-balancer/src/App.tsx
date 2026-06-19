import { useAppState } from './state/useAppState';
import { ParticipantSetup } from './components/ParticipantSetup';
import { EventsScreen } from './components/EventsScreen';
import { ResultsView } from './components/ResultsView';
import './App.css';

function App() {
  const { state, dispatch, getParticipantName } = useAppState();

  const goToEvents = () => {
    dispatch({ type: 'GO_TO_SCREEN', screen: 'events' });
  };

  const goToSetup = () => {
    dispatch({ type: 'GO_TO_SCREEN', screen: 'setup' });
  };

  const handleCalculate = () => {
    dispatch({ type: 'CALCULATE' });
  };

  const goBackToEvents = () => {
    dispatch({ type: 'CLEAR_RESULTS' });
    dispatch({ type: 'GO_TO_SCREEN', screen: 'events' });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Weekend Expense Balancer</h1>
        <p className="tagline">Split expenses fairly, settle up easily</p>
      </header>

      <main className="app-main">
        {state.currentScreen === 'setup' && (
          <ParticipantSetup
            participants={state.participants}
            dispatch={dispatch}
            onContinue={goToEvents}
          />
        )}

        {state.currentScreen === 'events' && (
          <EventsScreen
            events={state.events}
            participants={state.participants}
            dispatch={dispatch}
            onBack={goToSetup}
            onCalculate={handleCalculate}
          />
        )}

        {state.currentScreen === 'results' && state.results && (
          <ResultsView
            results={state.results}
            participants={state.participants}
            events={state.events}
            dispatch={dispatch}
            getParticipantName={getParticipantName}
            onBack={goBackToEvents}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>No data leaves your browser • Refresh-safe with local storage</p>
      </footer>
    </div>
  );
}

export default App;
