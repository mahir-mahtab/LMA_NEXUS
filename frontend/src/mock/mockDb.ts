/**
 * Mock Database Layer with localStorage persistence
 * Requirements: 14.1, 14.2, 14.4
 */

import {
  User,
  Session,
  WorkspaceMember,
  Workspace,
  Clause,
  Variable,
  GraphNode,
  GraphEdge,
  DriftItem,
  ReconciliationItem,
  ReconciliationSession,
  GoldenRecord,
  AuditEvent,
  Covenant,
  DownstreamConnector,
} from '../types';

const STORAGE_KEY = 'lma-nexus-db';

/**
 * Complete database state interface
 */
export interface DatabaseState {
  users: User[];
  sessions: Session[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  clauses: Clause[];
  variables: Variable[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  driftItems: DriftItem[];
  reconciliationItems: ReconciliationItem[];
  reconciliationSessions: ReconciliationSession[];
  goldenRecords: GoldenRecord[];
  auditEvents: AuditEvent[];
  covenants: Covenant[];
  downstreamConnectors: DownstreamConnector[];
}

/**
 * Empty database state
 */
export const emptyState: DatabaseState = {
  users: [],
  sessions: [],
  workspaces: [],
  workspaceMembers: [],
  clauses: [],
  variables: [],
  graphNodes: [],
  graphEdges: [],
  driftItems: [],
  reconciliationItems: [],
  reconciliationSessions: [],
  goldenRecords: [],
  auditEvents: [],
  covenants: [],
  downstreamConnectors: [],
};

// Seed data will be imported lazily to avoid circular dependencies
let seedData: DatabaseState | null = null;

/**
 * Set the seed data (called from seed.ts)
 */
export function setSeedData(data: DatabaseState): void {
  seedData = data;
}

/**
 * Get the seed data
 */
export function getSeedData(): DatabaseState {
  if (!seedData) {
    throw new Error('Seed data not initialized. Import seed.ts first.');
  }
  return seedData;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that the state has the correct structure
 */
function isValidState(state: unknown): state is DatabaseState {
  if (!state || typeof state !== 'object') return false;
  
  const requiredKeys: (keyof DatabaseState)[] = [
    'users',
    'sessions',
    'workspaces',
    'workspaceMembers',
    'clauses',
    'variables',
    'graphNodes',
    'graphEdges',
    'driftItems',
    'reconciliationItems',
    'reconciliationSessions',
    'goldenRecords',
    'auditEvents',
    'covenants',
    'downstreamConnectors',
  ];

  for (const key of requiredKeys) {
    if (!Array.isArray((state as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Get the current database state from localStorage
 * If localStorage is empty or corrupted, initializes with seed data
 * Requirements: 14.2, 14.3
 */
export function getState(): DatabaseState {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, using seed data');
    return getSeedData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      // Initialize with seed data if empty
      const seed = getSeedData();
      setState(seed);
      return seed;
    }

    const parsed = JSON.parse(stored);
    
    if (!isValidState(parsed)) {
      // Corrupted data, reset to seed
      console.warn('Corrupted localStorage data, resetting to seed');
      const seed = getSeedData();
      setState(seed);
      return seed;
    }

    return parsed;
  } catch (error) {
    // Parse error, reset to seed
    console.warn('Error parsing localStorage data, resetting to seed:', error);
    const seed = getSeedData();
    setState(seed);
    return seed;
  }
}

/**
 * Persist the database state to localStorage
 * Requirements: 14.1
 */
export function setState(state: DatabaseState): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, state not persisted');
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error persisting state to localStorage:', error);
    throw error;
  }
}

/**
 * Reset the database to the original seed state
 * Requirements: 14.4
 */
export function resetToSeed(): DatabaseState {
  const seed = getSeedData();
  setState(seed);
  return seed;
}

/**
 * Clear all data from localStorage (for testing)
 */
export function clearStorage(): void {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Update a specific collection in the database
 */
export function updateCollection<K extends keyof DatabaseState>(
  key: K,
  updater: (items: DatabaseState[K]) => DatabaseState[K]
): DatabaseState {
  const state = getState();
  const newState = {
    ...state,
    [key]: updater(state[key]),
  };
  setState(newState);
  return newState;
}

/**
 * Add an item to a collection
 */
export function addToCollection<K extends keyof DatabaseState>(
  key: K,
  item: DatabaseState[K][number]
): DatabaseState {
  return updateCollection(key, (items) => [...items, item] as DatabaseState[K]);
}

/**
 * Update an item in a collection by ID
 */
export function updateInCollection<K extends keyof DatabaseState>(
  key: K,
  id: string,
  updates: Partial<DatabaseState[K][number]>
): DatabaseState {
  return updateCollection(key, (items) => {
    const typedItems = items as Array<{ id: string }>;
    const updated = typedItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    return updated as DatabaseState[K];
  });
}

/**
 * Remove an item from a collection by ID
 */
export function removeFromCollection<K extends keyof DatabaseState>(
  key: K,
  id: string
): DatabaseState {
  return updateCollection(key, (items) => {
    // Type assertion to ensure we're working with an array of objects with id property
    const typedItems = items as Array<{ id: string }>;
    const filtered = typedItems.filter((item) => item.id !== id);
    return filtered as DatabaseState[K];
  });
}

/**
 * Find an item in a collection by ID
 */
export function findById<K extends keyof DatabaseState>(
  key: K,
  id: string
): DatabaseState[K][number] | undefined {
  const state = getState();
  const typedItems = state[key] as Array<{ id: string }>;
  return typedItems.find((item) => item.id === id) as DatabaseState[K][number] | undefined;
}

/**
 * Find items in a collection by a filter function
 */
export function findWhere<K extends keyof DatabaseState>(
  key: K,
  predicate: (item: DatabaseState[K][number]) => boolean
): DatabaseState[K] {
  const state = getState();
  const typedItems = state[key] as Array<DatabaseState[K][number]>;
  const filtered = typedItems.filter(predicate);
  return filtered as DatabaseState[K];
}
