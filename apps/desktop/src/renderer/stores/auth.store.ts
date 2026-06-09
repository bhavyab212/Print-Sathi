import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Shop } from '@shared/types/shop';

interface AuthState {
  session: Session | null;
  user: User | null;
  shop: Shop | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchShop: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  shop: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      set({ session, user: session?.user || null, isInitialized: true });
      
      if (session?.user) {
        await get().fetchShop(session.user.id);
      } else {
        set({ isLoading: false });
      }

      // Set up auth listener
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        set({ session: newSession, user: newSession?.user || null });
        if (event === 'SIGNED_IN' && newSession?.user) {
          await get().fetchShop(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          set({ shop: null, isLoading: false });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  setSession: (session) => {
    set({ session, user: session?.user || null });
  },

  fetchShop: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching shop:', error);
      }
      
      set({ shop: data as Shop | null, isLoading: false });
    } catch (error) {
      console.error('Error in fetchShop:', error);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, shop: null });
  }
}));
