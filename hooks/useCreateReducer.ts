import { useMemo, useReducer } from 'react';

// Extracts property names from initial state of reducer to allow typesafe dispatch objects
export type FieldNames<T> = {
  [K in keyof T]: T[K] extends string ? K : K;
}[keyof T];

// Returns the Action Type for the dispatch object to be used for typing in things like context
export type ActionType<T> =
  | { type: 'reset' }
  | { type: 'partialReset'; payload: Partial<T> }
  | { type?: 'change'; field: FieldNames<T>; value: any };

// Returns a typed dispatch and state
export const useCreateReducer = <T>({ initialState }: { initialState: T }) => {
  type Action =
    | { type: 'reset' }
    | { type: 'partialReset'; payload: Partial<T> }
    | { type?: 'change'; field: FieldNames<T>; value: any };

  const reducer = (state: T, action: Action) => {
    if (!action.type || action.type === 'change') {
      return { ...state, [action.field]: action.value };
    }

    if (action.type === 'reset') return initialState;

    if (action.type === 'partialReset') {
      return { ...state, ...action.payload };
    }

    throw new Error('Unhandled action type');
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return useMemo(() => ({ state, dispatch }), [state, dispatch]);
};
