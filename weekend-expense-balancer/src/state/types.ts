// Core data types for the Weekend Expense Balancer

export interface Participant {
  id: string;
  name: string;
}

export interface LineItem {
  id: string;
  label: string;
  amount: number;
}

export interface EventEntry {
  expected: number;
  actual: number;
  included: boolean;
  lineItems: LineItem[]; // itemized breakdown of expected amount
}

export interface ExpenseEvent {
  id: string;
  name: string;
  entries: Record<string, EventEntry>;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface CalculationResult {
  balances: Record<string, number>;
  settlements: Settlement[];
  // per-event net for each participant: eventBalances[eventId][participantId] = actual - expected
  eventBalances: Record<string, Record<string, number>>;
}

export interface AppState {
  participants: Participant[];
  events: ExpenseEvent[];
  results: CalculationResult | null;
  currentScreen: "setup" | "events" | "results";
}

export type AppAction =
  | { type: "ADD_PARTICIPANT"; name: string }
  | { type: "REMOVE_PARTICIPANT"; id: string }
  | { type: "UPDATE_PARTICIPANT"; id: string; name: string }
  | { type: "ADD_EVENT"; name: string }
  | { type: "REMOVE_EVENT"; id: string }
  | { type: "UPDATE_EVENT_NAME"; id: string; name: string }
  | {
      type: "UPDATE_EVENT_ENTRY";
      eventId: string;
      participantId: string;
      field: "expected" | "actual";
      value: number;
    }
  | { type: "SPLIT_EQUALLY"; eventId: string; total: number }
  | {
      type: "SET_SINGLE_PAYER";
      eventId: string;
      payerId: string;
      total: number;
    }
  | { type: "EXCLUDE_PARTICIPANT"; eventId: string; participantId: string }
  | { type: "INCLUDE_PARTICIPANT"; eventId: string; participantId: string }
  | {
      type: "ADD_LINE_ITEM";
      eventId: string;
      participantId: string;
      label: string;
      amount: number;
    }
  | {
      type: "REMOVE_LINE_ITEM";
      eventId: string;
      participantId: string;
      lineItemId: string;
    }
  | {
      type: "UPDATE_LINE_ITEM";
      eventId: string;
      participantId: string;
      lineItemId: string;
      label: string;
      amount: number;
    }
  | { type: "CALCULATE" }
  | { type: "CLEAR_RESULTS" }
  | { type: "GO_TO_SCREEN"; screen: "setup" | "events" | "results" }
  | { type: "LOAD_STATE"; state: Partial<AppState> };
