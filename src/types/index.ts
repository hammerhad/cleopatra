export * from './user';
export * from './habits';
export * from './tasks';
export * from './training';
export * from './journal';
export * from './cycle';
export * from './court';

// ── Common ─────────────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  lastDoc: unknown;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}
