import { createClient } from '@supabase/supabase-js';
import type { ExtendedDatabase } from './extended-types';
import { previewTables } from '@/data/adminMockData';

// Using environment variables for security
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isLocalPreview =
  import.meta.env.VITE_MOCK_AUTH === 'true' ||
  import.meta.env.VITE_MOCK_PRODUCTS === 'true' ||
  import.meta.env.VITE_SUPABASE_PROJECT_ID === 'dummy-project' ||
  rawSupabaseUrl.includes('dummy-project') ||
  (import.meta.env.DEV && (!rawSupabaseUrl || !rawSupabaseAnonKey));

const SUPABASE_URL = rawSupabaseUrl || 'https://dummy-project.supabase.co';
const SUPABASE_ANON_KEY = rawSupabaseAnonKey || 'dummy-anon-key-for-local-preview';

// Validate environment variables are set
if (isLocalPreview) {
  console.warn('Missing Supabase environment variables. Using local preview mock data.');
}

const realSupabase = createClient<ExtendedDatabase>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

class PreviewQueryBuilder {
  private filters: Array<{ column: string; operator: 'eq' | 'neq' | 'gte' | 'lt' | 'ilike' | 'in'; value: unknown }> = [];
  private orderBy?: { column: string; ascending: boolean };
  private limitCount?: number;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any;

  constructor(private table: string) {}

  select() {
    return this;
  }

  insert(payload: any) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  upsert(payload: any) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, operator: 'in', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.limitCount = Math.max(0, to - from + 1);
    return this;
  }

  maybeSingle() {
    return this.executeSingle(false);
  }

  single() {
    return this.executeSingle(true);
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private get rows() {
    if (!previewTables[this.table]) previewTables[this.table] = [];
    return previewTables[this.table];
  }

  private matches(row: any) {
    return this.filters.every(({ column, operator, value }) => {
      const rowValue = row?.[column];

      if (operator === 'eq') return rowValue === value;
      if (operator === 'neq') return rowValue !== value;
      if (operator === 'gte') return String(rowValue) >= String(value);
      if (operator === 'lt') return String(rowValue) < String(value);
      if (operator === 'in') return Array.isArray(value) && value.includes(rowValue);
      if (operator === 'ilike') {
        const pattern = String(value).replace(/%/g, '').toLowerCase();
        return String(rowValue || '').toLowerCase().includes(pattern);
      }

      return true;
    });
  }

  private readRows() {
    let rows = clone(this.rows).filter((row: any) => this.matches(row));

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = rows.sort((a: any, b: any) => {
        const left = a?.[column] ?? '';
        const right = b?.[column] ?? '';
        if (left === right) return 0;
        return (left > right ? 1 : -1) * (ascending ? 1 : -1);
      });
    }

    if (this.limitCount !== undefined) {
      rows = rows.slice(0, this.limitCount);
    }

    return rows;
  }

  private async execute() {
    if (this.operation === 'insert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = payloads.map((item) => ({
        id: item.id || `preview-${this.table}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        ...item,
      }));
      this.rows.push(...inserted);
      return { data: clone(inserted), error: null };
    }

    if (this.operation === 'update') {
      const updated: any[] = [];
      this.rows.forEach((row: any) => {
        if (this.matches(row)) {
          Object.assign(row, this.payload, { updated_at: new Date().toISOString() });
          updated.push(row);
        }
      });
      return { data: clone(updated), error: null };
    }

    if (this.operation === 'delete') {
      const remaining = this.rows.filter((row: any) => !this.matches(row));
      previewTables[this.table] = remaining;
      return { data: null, error: null };
    }

    return { data: this.readRows(), error: null };
  }

  private async executeSingle(required: boolean) {
    const { data } = await this.execute();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row && required) {
      return { data: null, error: { code: 'PGRST116', message: 'No preview row found' } };
    }
    return { data: row || null, error: null };
  }
}

const previewAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({
    data: {
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'admin@demo.local',
        app_metadata: { role: 'admin' },
      },
    },
    error: null,
  }),
  signInWithPassword: async () => ({
    data: { user: null, session: null },
    error: { message: 'Use local preview accounts from the login page.' },
  }),
  signUp: async ({ email }: { email: string }) => ({
    data: {
      user: {
        id: `preview-user-${Date.now()}`,
        email,
        app_metadata: { role: 'user' },
      },
    },
    error: null,
  }),
  signOut: async () => ({ error: null }),
  refreshSession: async () => ({ data: { session: null }, error: null }),
  resetPasswordForEmail: async () => ({ data: {}, error: null }),
  onAuthStateChange: () => ({
    data: {
      subscription: {
        unsubscribe: () => undefined,
      },
    },
  }),
  admin: {
    updateUserById: async () => ({ data: {}, error: null }),
  },
};

const previewSupabase = {
  from: (table: string) => new PreviewQueryBuilder(table),
  rpc: async (fn: string, args?: any) => {
    if (fn === 'update_distributor_status') {
      const row = previewTables.distributor_profiles.find(
        (profile) => profile.user_id === args?.distributor_user_id
      );
      if (row) {
        row.status = args?.new_status;
        row.approval_status = args?.new_status === 'active' ? 'approved' : args?.new_status;
        row.updated_at = new Date().toISOString();
      }
      return { data: Boolean(row), error: null };
    }

    if (fn === 'batch_approve_distributors') {
      let count = 0;
      previewTables.distributor_profiles.forEach((profile) => {
        if (args?.distributor_user_ids?.includes(profile.user_id) && profile.status === 'pending') {
          profile.status = 'active';
          profile.approval_status = 'approved';
          profile.updated_at = new Date().toISOString();
          count += 1;
        }
      });
      return { data: count, error: null };
    }

    return { data: null, error: null };
  },
  auth: previewAuth,
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = (isLocalPreview ? previewSupabase : realSupabase) as unknown as typeof realSupabase;

/**
 * Check if the current user has admin role
 * @returns {Promise<boolean>} Whether the user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // First check jwt claims if they exist
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const claims = JSON.parse(atob(session.access_token.split('.')[1]));
      if (claims && claims.role === 'admin') {
        return true;
      }
    }
    
    // Check user app_metadata for admin role (server-side managed)
    if (user.app_metadata?.role === 'admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
