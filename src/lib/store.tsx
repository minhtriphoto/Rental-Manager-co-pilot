import React, { createContext, useContext, useState, useEffect } from 'react';
import { Building, Room, Tenant, Contract, Invoice, MaintenanceRequest, UtilityReading, Transaction, RoomAsset, CheckoutChecklist } from '../types';
import { mockBuildings, mockRooms, mockTenants, mockContracts, mockInvoices, mockMaintenances, mockTransactions } from './mockData';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';

type AppState = {
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  invoices: Invoice[];
  maintenances: MaintenanceRequest[];
  utilityReadings: UtilityReading[];
  transactions: Transaction[];
  roomAssets: RoomAsset[];
  checkoutChecklists: CheckoutChecklist[];
};

type AppContextType = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  updateRoomStatus: (roomId: string, status: Room['status']) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setUtilityReadings: (readings: UtilityReading[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setRoomAssets: (assets: RoomAsset[]) => void;
  setCheckoutChecklists: (checklists: CheckoutChecklist[]) => void;
  isCloudSyncActive: boolean;
  isCloudSyncing: boolean;
  cloudSyncError: string | null;
  setCloudSyncActive: (active: boolean) => void;
  forceUploadToCloud: () => Promise<void>;
  forceDownloadFromCloud: () => Promise<void>;
  clearCloudSyncError: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('is_cloud_sync_active');
    return saved !== null ? saved === 'true' : true; // Default to true so it syncs immediately!
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  const [rawState, setRawState] = useState<AppState>(() => {
    const saved = localStorage.getItem('rental_app_state');
    const initialMockRoomAssets: RoomAsset[] = [
      {
        id: 'asset-1',
        roomId: 'r1',
        name: 'Điều hòa Daikin 9000BTU',
        quantity: 1,
        initialStatus: 'Hoạt động tốt, mới 95%',
        image: '',
        estimatedValue: 7500000,
        handoverDate: '2023-01-10',
        notes: 'Có điều khiển từ xa đi kèm'
      },
      {
        id: 'asset-2',
        roomId: 'r1',
        name: 'Nóng lạnh Ariston 20L',
        quantity: 1,
        initialStatus: 'Hoạt động bình thường',
        image: '',
        estimatedValue: 3200000,
        handoverDate: '2023-01-10',
        notes: ''
      },
      {
        id: 'asset-3',
        roomId: 'r1',
        name: 'Tủ lạnh Toshiba 150L',
        quantity: 1,
        initialStatus: 'Mới 100%, không trầy xước',
        image: '',
        estimatedValue: 4800000,
        handoverDate: '2023-01-12',
        notes: ''
      },
      {
        id: 'asset-4',
        roomId: 'r2',
        name: 'Điều hòa Panasonic 12000BTU',
        quantity: 1,
        initialStatus: 'Mới lắp đặt, hoạt động tốt',
        image: '',
        estimatedValue: 9000000,
        handoverDate: '2023-02-15',
        notes: ''
      },
      {
        id: 'asset-5',
        roomId: 'r2',
        name: 'Giường gỗ sồi 1m6 × 2m',
        quantity: 1,
        initialStatus: 'Khung chắc chắn, không mối mọt',
        image: '',
        estimatedValue: 4000000,
        handoverDate: '2023-02-15',
        notes: 'Kèm theo đệm bông ép'
      }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          buildings: parsed.buildings || mockBuildings,
          rooms: parsed.rooms || mockRooms,
          tenants: parsed.tenants || mockTenants,
          contracts: parsed.contracts || mockContracts,
          invoices: parsed.invoices || mockInvoices,
          maintenances: parsed.maintenances || mockMaintenances,
          utilityReadings: parsed.utilityReadings || [],
          transactions: parsed.transactions || mockTransactions,
          roomAssets: parsed.roomAssets || initialMockRoomAssets,
          checkoutChecklists: parsed.checkoutChecklists || [],
        };
      } catch (e) {
        console.error('Failed to parse local state', e);
      }
    }
    return {
      buildings: mockBuildings,
      rooms: mockRooms,
      tenants: mockTenants,
      contracts: mockContracts,
      invoices: mockInvoices,
      maintenances: mockMaintenances,
      utilityReadings: [],
      transactions: mockTransactions,
      roomAssets: initialMockRoomAssets,
      checkoutChecklists: [],
    };
  });

  const collectionsList: { key: keyof AppState; path: string }[] = [
    { key: 'buildings', path: 'buildings' },
    { key: 'rooms', path: 'rooms' },
    { key: 'tenants', path: 'tenants' },
    { key: 'contracts', path: 'contracts' },
    { key: 'invoices', path: 'invoices' },
    { key: 'maintenances', path: 'maintenances' },
    { key: 'utilityReadings', path: 'utilityReadings' },
    { key: 'transactions', path: 'transactions' },
    { key: 'roomAssets', path: 'roomAssets' },
    { key: 'checkoutChecklists', path: 'checkoutChecklists' }
  ];

  const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore);
    }
    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const val = obj[key];
          if (val !== undefined) {
            newObj[key] = sanitizeForFirestore(val);
          }
        }
      }
      return newObj;
    }
    return obj;
  };

  const writeStateChangesToFirestore = async (prev: AppState, next: AppState) => {
    collectionsList.forEach(async (col) => {
      const prevArr = prev[col.key] as any[];
      const nextArr = next[col.key] as any[];
      
      if (prevArr !== nextArr) {
        // 1. Check for creations and modifications
        nextArr.forEach(async (item) => {
          const prevItem = prevArr.find(x => x.id === item.id);
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            try {
              await setDoc(doc(db, col.path, item.id), sanitizeForFirestore(item));
            } catch (e) {
              console.error(`[Firebase] Error updating ${col.key}/${item.id}:`, e);
            }
          }
        });

        // 2. Check for deletions
        prevArr.forEach(async (prevItem) => {
          if (!nextArr.some(x => x.id === prevItem.id)) {
            try {
              await deleteDoc(doc(db, col.path, prevItem.id));
            } catch (e) {
              console.error(`[Firebase] Error deleting ${col.key}/${prevItem.id}:`, e);
            }
          }
        });
      }
    });
  };

  // Persist local sync toggle choice
  useEffect(() => {
    localStorage.setItem('is_cloud_sync_active', String(isCloudSyncActive));
  }, [isCloudSyncActive]);

  // Real-time synchronization listeners & cloud checking
  useEffect(() => {
    if (!isCloudSyncActive) return;

    let active = true;

    const checkAndListen = async () => {
      try {
        setIsCloudSyncing(true);
        const snap = await getDocs(collection(db, 'buildings'));
        if (snap.empty) {
          console.log("[Firebase] Empty Firestore. Seeding current state to cloud...");
          for (const col of collectionsList) {
            const items = rawState[col.key] as any[];
            for (const item of items) {
              if (item && item.id) {
                await setDoc(doc(db, col.path, item.id), sanitizeForFirestore(item));
              }
            }
          }
        }
      } catch (err: any) {
        console.error("[Firebase] Initial connection verify failed:", err);
        setCloudSyncError(`Không thể kết nối Firestore (Đang chạy offline): ${err.message}`);
      } finally {
        if (active) setIsCloudSyncing(false);
      }

      if (!active) return;

      const unsubscribes: (() => void)[] = [];

      collectionsList.forEach((col) => {
        const unsub = onSnapshot(collection(db, col.path), (snapshot) => {
          const items: any[] = [];
          snapshot.forEach((dt) => {
            items.push({ id: dt.id, ...dt.data() });
          });

          setRawState((current) => {
            if (JSON.stringify(current[col.key]) === JSON.stringify(items)) {
              return current;
            }
            return {
              ...current,
              [col.key]: items
            };
          });
        }, (error) => {
          console.error(`[Firebase] Sync error on col ${col.key}:`, error);
          setCloudSyncError(`Đồng bộ thất bại [${col.key}]: ${error.message}`);
        });
        unsubscribes.push(unsub);
      });

      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    };

    let stopListen: (() => void) | undefined;
    checkAndListen().then((unsub) => {
      if (active) {
        stopListen = unsub;
      } else if (unsub) {
        unsub();
      }
    });

    return () => {
      active = false;
      if (stopListen) stopListen();
    };
  }, [isCloudSyncActive]);

  const forceUploadToCloud = async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(null);
    try {
      for (const col of collectionsList) {
        const items = rawState[col.key] as any[];
        for (const item of items) {
          if (item && item.id) {
            await setDoc(doc(db, col.path, item.id), sanitizeForFirestore(item));
          }
        }
      }
      alert('Tải toàn bộ dữ liệu lên đám mây thành công!');
    } catch (err: any) {
      console.error("[Firebase] Manual backup failed:", err);
      setCloudSyncError(err.message || 'Lỗi tải dữ liệu lên đám mây');
      alert(`Đồng bộ thất bại: ${err.message}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const forceDownloadFromCloud = async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(null);
    try {
      const newState: Partial<AppState> = {};
      for (const col of collectionsList) {
        const snap = await getDocs(collection(db, col.path));
        const items: any[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        newState[col.key] = items as any;
      }
      setRawState(newState as AppState);
      localStorage.setItem('rental_app_state', JSON.stringify(newState));
      alert('Tải dữ liệu từ đám mây về máy này thành công!');
    } catch (err: any) {
      console.error("[Firebase] Force restore failed:", err);
      setCloudSyncError(err.message || 'Lỗi tải dữ liệu từ đám mây');
      alert(`Khôi phục thất bại: ${err.message}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const setCloudSyncActive = (active: boolean) => {
    setIsCloudSyncActive(active);
  };

  const clearCloudSyncError = () => {
    setCloudSyncError(null);
  };

  const setState = (value: React.SetStateAction<AppState>) => {
    setRawState(prev => {
      const nextState = typeof value === 'function' ? (value as Function)(prev) : value;
      localStorage.setItem('rental_app_state', JSON.stringify(nextState));
      
      if (isCloudSyncActive) {
        writeStateChangesToFirestore(prev, nextState);
      }
      return nextState;
    });
  };

  const updateRoomStatus = (roomId: string, status: Room['status']) => {
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, status } : r)
    }));
  };

  const setInvoices = (invoices: Invoice[]) => {
    setState(prev => ({ ...prev, invoices }));
  };

  const setUtilityReadings = (readings: UtilityReading[]) => {
    setState(prev => ({ ...prev, utilityReadings: readings }));
  };

  const setTransactions = (transactions: Transaction[]) => {
    setState(prev => ({ ...prev, transactions }));
  };

  const setRoomAssets = (roomAssets: RoomAsset[]) => {
    setState(prev => ({ ...prev, roomAssets }));
  };

  const setCheckoutChecklists = (checkoutChecklists: CheckoutChecklist[]) => {
    setState(prev => ({ ...prev, checkoutChecklists }));
  };

  return (
    <AppContext.Provider value={{ 
      state: rawState, 
      setState, 
      updateRoomStatus, 
      setInvoices, 
      setUtilityReadings, 
      setTransactions,
      setRoomAssets,
      setCheckoutChecklists,
      isCloudSyncActive,
      isCloudSyncing,
      cloudSyncError,
      setCloudSyncActive,
      forceUploadToCloud,
      forceDownloadFromCloud,
      clearCloudSyncError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within an AppProvider');
  return context;
};
