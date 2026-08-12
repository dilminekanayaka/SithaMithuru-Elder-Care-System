/**
 * SyncContext.tsx — Observable Offline Synchronization State Context & Hook
 *
 * Provides real-time sync state visibility across Elder & Guardian views:
 *  • syncState: 'idle' | 'syncing' | 'synced' | 'partial' | 'failed' | 'offline'
 *  • lastSyncedAt: Date | null
 *  • pendingCount: number (Total offline items waiting in queue)
 *  • syncNow: () => Promise<void>
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';
import { getDB } from '../database/db';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'partial' | 'failed' | 'offline';

interface SyncContextValue {
  syncState: SyncState;
  lastSyncedAt: Date | null;
  pendingCount: number;
  syncNow: (elderId?: string, token?: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode; elderId?: string; token?: string }> = ({
  children,
  elderId,
  token,
}) => {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Monitor connectivity
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline((prevOnline) => {
        if (!online) {
          setSyncState('offline');
        } else if (prevOnline === false && online) {
          // OS-04: Auto-trigger synchronization upon network reconnection
          syncNow();
        }
        return online;
      });
    });
    return () => unsub();
  }, []);

  const countPending = useCallback(async () => {
    try {
      const db = await getDB();
      const em = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM emergency_logs_offline WHERE synced = 0');
      const med = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM medication_logs_offline WHERE synced = 0');
      const tsk = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM task_logs_offline WHERE synced = 0');
      const md = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM mood_logs_offline WHERE synced = 0');
      const total = (em?.cnt || 0) + (med?.cnt || 0) + (tsk?.cnt || 0) + (md?.cnt || 0);
      setPendingCount(total);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    countPending();
  }, [countPending]);

  const syncNow = useCallback(
    async (targetElderId?: string, targetToken?: string) => {
      const eid = targetElderId || elderId;
      const tok = targetToken || token;

      if (!isOnline) {
        setSyncState('offline');
        return;
      }
      if (!eid || !tok) return;

      setSyncState('syncing');
      const ok = await syncService.syncOfflineQueue(eid, tok);
      await countPending();

      if (ok) {
        setSyncState('synced');
        setLastSyncedAt(new Date());
      } else {
        setSyncState('failed');
      }
    },
    [elderId, token, isOnline, countPending]
  );

  return (
    <SyncContext.Provider
      value={{
        syncState,
        lastSyncedAt,
        pendingCount,
        syncNow,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
};
