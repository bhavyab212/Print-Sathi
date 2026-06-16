import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type PresencePayload = {
  id: string;
  role: 'customer' | 'shopkeeper' | 'admin';
  shopId?: string;
  name?: string;
};

export function usePresence(roomName: string, userPayload: PresencePayload) {
  const [onlineUsers, setOnlineUsers] = useState<PresencePayload[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase.channel(roomName, {
      config: {
        presence: {
          key: userPayload.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as unknown as PresencePayload[];
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userPayload);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, JSON.stringify(userPayload)]);

  return { onlineUsers };
}
