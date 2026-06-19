import { useReducer, useEffect, useCallback } from "react";
import type { AppState, AppAction, ExpenseEvent } from "./types";
import { runCalculation } from "../logic/calculateBalances";

const STORAGE_KEY = "weekend-expense-balancer-state";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createInitialEntries(
  participants: AppState["participants"],
): ExpenseEvent["entries"] {
  const entries: ExpenseEvent["entries"] = {};
  for (const p of participants) {
    entries[p.id] = { expected: 0, actual: 0, included: true, lineItems: [] };
  }
  return entries;
}

const initialState: AppState = {
  participants: [],
  events: [],
  results: null,
  currentScreen: "setup",
};

function sumLineItems(lineItems: { amount: number }[]): number {
  return lineItems.reduce((s, li) => s + li.amount, 0);
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_PARTICIPANT": {
      const newParticipant = { id: generateId(), name: action.name };
      const updatedEvents = state.events.map((event) => ({
        ...event,
        entries: {
          ...event.entries,
          [newParticipant.id]: {
            expected: 0,
            actual: 0,
            included: true,
            lineItems: [],
          },
        },
      }));
      return {
        ...state,
        participants: [...state.participants, newParticipant],
        events: updatedEvents,
        results: null,
      };
    }

    case "REMOVE_PARTICIPANT": {
      const updatedEvents = state.events.map((event) => {
        const { [action.id]: _, ...remainingEntries } = event.entries;
        return { ...event, entries: remainingEntries };
      });
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== action.id),
        events: updatedEvents,
        results: null,
      };
    }

    case "UPDATE_PARTICIPANT": {
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.id === action.id ? { ...p, name: action.name } : p,
        ),
        results: null,
      };
    }

    case "ADD_EVENT": {
      const newEvent: ExpenseEvent = {
        id: generateId(),
        name: action.name,
        entries: createInitialEntries(state.participants),
      };
      return {
        ...state,
        events: [...state.events, newEvent],
        results: null,
      };
    }

    case "REMOVE_EVENT": {
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.id),
        results: null,
      };
    }

    case "UPDATE_EVENT_NAME": {
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, name: action.name } : e,
        ),
        results: null,
      };
    }

    case "UPDATE_EVENT_ENTRY": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          return {
            ...e,
            entries: {
              ...e.entries,
              [action.participantId]: {
                ...e.entries[action.participantId],
                [action.field]: action.value,
                // If manually editing expected, clear line items
                ...(action.field === "expected" ? { lineItems: [] } : {}),
              },
            },
          };
        }),
        results: null,
      };
    }

    case "ADD_LINE_ITEM": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const entry = e.entries[action.participantId];
          const newLineItem = {
            id: generateId(),
            label: action.label,
            amount: action.amount,
          };
          const newLineItems = [...(entry.lineItems || []), newLineItem];
          return {
            ...e,
            entries: {
              ...e.entries,
              [action.participantId]: {
                ...entry,
                lineItems: newLineItems,
                expected: Math.round(sumLineItems(newLineItems) * 100) / 100,
              },
            },
          };
        }),
        results: null,
      };
    }

    case "REMOVE_LINE_ITEM": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const entry = e.entries[action.participantId];
          const newLineItems = (entry.lineItems || []).filter(
            (li) => li.id !== action.lineItemId,
          );
          return {
            ...e,
            entries: {
              ...e.entries,
              [action.participantId]: {
                ...entry,
                lineItems: newLineItems,
                expected: Math.round(sumLineItems(newLineItems) * 100) / 100,
              },
            },
          };
        }),
        results: null,
      };
    }

    case "UPDATE_LINE_ITEM": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const entry = e.entries[action.participantId];
          const newLineItems = (entry.lineItems || []).map((li) =>
            li.id === action.lineItemId
              ? { ...li, label: action.label, amount: action.amount }
              : li,
          );
          return {
            ...e,
            entries: {
              ...e.entries,
              [action.participantId]: {
                ...entry,
                lineItems: newLineItems,
                expected: Math.round(sumLineItems(newLineItems) * 100) / 100,
              },
            },
          };
        }),
        results: null,
      };
    }

    case "SPLIT_EQUALLY": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;

          const includedCount = Object.values(e.entries).filter(
            (entry) => entry.included,
          ).length;
          if (includedCount === 0) return e;

          const splitAmount =
            Math.round((action.total / includedCount) * 100) / 100;
          const updatedEntries = { ...e.entries };

          for (const pid of Object.keys(updatedEntries)) {
            if (updatedEntries[pid].included) {
              updatedEntries[pid] = {
                ...updatedEntries[pid],
                expected: splitAmount,
                lineItems: [], // clear line items when splitting equally
              };
            }
          }
          return { ...e, entries: updatedEntries };
        }),
        results: null,
      };
    }

    case "SET_SINGLE_PAYER": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          const updatedEntries = { ...e.entries };
          for (const pid of Object.keys(updatedEntries)) {
            updatedEntries[pid] = {
              ...updatedEntries[pid],
              actual: pid === action.payerId ? action.total : 0,
            };
          }
          return { ...e, entries: updatedEntries };
        }),
        results: null,
      };
    }

    case "EXCLUDE_PARTICIPANT": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          return {
            ...e,
            entries: {
              ...e.entries,
              [action.participantId]: {
                ...e.entries[action.participantId],
                expected: 0,
                actual: 0,
                included: false,
                lineItems: [],
              },
            },
          };
        }),
        results: null,
      };
    }

    case "INCLUDE_PARTICIPANT": {
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e;
          return {
            ...e,
            entries: {
              ...e.entries,
              [action.participantId]: {
                ...e.entries[action.participantId],
                included: true,
              },
            },
          };
        }),
        results: null,
      };
    }

    case "CALCULATE": {
      const results = runCalculation(state);
      return {
        ...state,
        results,
        currentScreen: "results",
      };
    }

    case "CLEAR_RESULTS": {
      return {
        ...state,
        results: null,
      };
    }

    case "GO_TO_SCREEN": {
      return {
        ...state,
        currentScreen: action.screen,
      };
    }

    case "LOAD_STATE": {
      // Migrate old data: ensure lineItems exists on all entries
      const migratedEvents = (action.state.events || []).map((event) => ({
        ...event,
        entries: Object.fromEntries(
          Object.entries(event.entries).map(([pid, entry]) => [
            pid,
            { lineItems: [], ...entry },
          ]),
        ),
      }));
      return {
        ...state,
        ...action.state,
        events: migratedEvents,
        results: null,
      };
    }

    default:
      return state;
  }
}

function loadFromStorage(): Partial<AppState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        participants: parsed.participants || [],
        events: parsed.events || [],
        currentScreen: parsed.currentScreen || "setup",
      };
    }
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
  }
  return null;
}

function saveToStorage(state: AppState): void {
  try {
    const toStore = {
      participants: state.participants,
      events: state.events,
      currentScreen: state.currentScreen,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      dispatch({ type: "LOAD_STATE", state: stored });
    }
  }, []);

  useEffect(() => {
    saveToStorage(state);
  }, [state.participants, state.events, state.currentScreen]);

  const getParticipantName = useCallback(
    (id: string): string => {
      const participant = state.participants.find((p) => p.id === id);
      return participant?.name || "Unknown";
    },
    [state.participants],
  );

  return { state, dispatch, getParticipantName };
}
