// This is a mock Supabase client for local-only development.
// It bypasses all network calls and returns empty data or mock success.

export const supabase: any = {
  auth: {
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
      return { data: { session }, error: null };
    },
    signInWithPassword: async () => {
      // This is handled locally in AuthPage.tsx now
      return { data: { user: { id: 'demo' } }, error: null };
    },
    signUp: async () => {
      return { data: { user: null }, error: new Error('Signup is disabled in demo mode') };
    },
    signOut: async () => {
      localStorage.removeItem('sb-session');
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      const handleStorage = () => {
        const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
        callback('SIGNED_IN', session);
      };
      window.addEventListener('storage', handleStorage);
      setTimeout(handleStorage, 0);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handleStorage) } } };
    }
  },
  from: () => {
    const mockQuery = {
      select: () => mockQuery,
      eq: () => mockQuery,
      single: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      order: () => mockQuery,
      limit: () => mockQuery,
      insert: async () => ({ data: null, error: null }),
      update: () => mockQuery,
      delete: () => mockQuery,
      contains: () => mockQuery,
      then: (cb: any) => cb({ data: [], error: null })
    };
    return mockQuery;
  }
};
