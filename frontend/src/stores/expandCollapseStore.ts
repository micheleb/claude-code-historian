import { atom } from 'jotai';

// Global action interface for timestamp-based events
export interface GlobalExpandAction {
  action: 'expand' | 'collapse';
  timestamp: number;
}

// Primary atom for global expand/collapse actions using timestamps
export const globalExpandActionAtom = atom<GlobalExpandAction | null>(null);

// Loading state atom for the global buttons
export const isGlobalLoadingAtom = atom<boolean>(false);

// Derived atom to trigger global actions with timestamps
export const triggerGlobalExpandAtom = atom(
  null,
  (_get, set, action: 'expand' | 'collapse') => {
    // Set loading state immediately
    set(isGlobalLoadingAtom, true);
    
    // Create timestamped action - this persists until next action
    set(globalExpandActionAtom, {
      action,
      timestamp: Date.now()
    });
    
    // Clear loading state after a delay to ensure React processes the action
    setTimeout(() => {
      set(isGlobalLoadingAtom, false);
    }, 300);
  }
);