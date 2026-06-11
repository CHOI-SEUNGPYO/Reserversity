import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Reservation {
  id: string;
  groupId?: string;
  dateStr: string;
  resourceName: string;
  startHour: number;
  endHour: number;
  title: string;
  author: string;
  authorId?: string;
  approver: string;
  color: string;
  remarks: string;
  category: string;
}

interface ReservationContextType {
  reservations: Reservation[];
  addReservation: (res: Reservation, forceApprove?: boolean) => Promise<{success: boolean, error?: string}>;
  addReservations: (resList: Reservation[], forceApprove?: boolean) => Promise<{success: boolean, error?: string}>;
  updateReservation: (id: string, updated: Reservation, updateGroup?: boolean) => Promise<{success: boolean, error?: string}>;
  deleteReservation: (id: string, deleteGroup?: boolean) => Promise<{success: boolean, error?: string}>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const fetchReservations = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('reservation:list');
      if (result.success) setReservations(result.data);
    } else {
      const stored = localStorage.getItem('mock_reservations');
      if (stored) setReservations(JSON.parse(stored));
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const addReservation = async (res: Reservation, forceApprove = false) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('reservation:create', { ...res, id: undefined }, forceApprove);
      if (result.success) {
        await fetchReservations();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } else {
      const stored = localStorage.getItem('mock_reservations');
      const list = stored ? JSON.parse(stored) : [];
      list.push(res);
      localStorage.setItem('mock_reservations', JSON.stringify(list));
      setReservations(list);
      return { success: true };
    }
  };

  const addReservations = async (resList: Reservation[], forceApprove = false) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('reservation:create', resList.map(r => ({ ...r, id: undefined })), forceApprove);
      if (result.success) {
        await fetchReservations();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } else {
      const stored = localStorage.getItem('mock_reservations');
      const list = stored ? JSON.parse(stored) : [];
      list.push(...resList);
      localStorage.setItem('mock_reservations', JSON.stringify(list));
      setReservations(list);
      return { success: true };
    }
  };

  const updateReservation = async (id: string, updated: Reservation, updateGroup: boolean = false): Promise<{success: boolean, error?: string}> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('reservation:update', { id, data: updated, updateGroup });
      if (result.success) {
        await fetchReservations();
        return { success: true };
      }
      return { success: false, error: result.error };
    } else {
      const stored = localStorage.getItem('mock_reservations');
      let list = stored ? JSON.parse(stored) : [];
      if (updateGroup && updated.groupId) {
        list = list.map((r: any) => r.groupId === updated.groupId ? { ...updated, id: r.id, dateStr: r.dateStr, groupId: r.groupId } : r);
      } else {
        list = list.map((r: any) => r.id === id ? updated : r);
      }
      localStorage.setItem('mock_reservations', JSON.stringify(list));
      setReservations(list);
      return { success: true };
    }
  };

  const deleteReservation = async (id: string, deleteGroup: boolean = false): Promise<{success: boolean, error?: string}> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('reservation:delete', { id, deleteGroup });
      if (result.success) {
        await fetchReservations();
        return { success: true };
      }
      return { success: false, error: result.error };
    } else {
      const stored = localStorage.getItem('mock_reservations');
      let list = stored ? JSON.parse(stored) : [];
      if (deleteGroup) {
        const res = list.find((r: any) => r.id === id);
        if (res && res.groupId) {
          list = list.filter((r: any) => r.groupId !== res.groupId);
        } else {
          list = list.filter((r: any) => r.id !== id);
        }
      } else {
        list = list.filter((r: any) => r.id !== id);
      }
      localStorage.setItem('mock_reservations', JSON.stringify(list));
      setReservations(list);
      return { success: true };
    }
  };

  return (
    <ReservationContext.Provider value={{ reservations, addReservation, addReservations, updateReservation, deleteReservation }}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) throw new Error('useReservations must be used within ReservationProvider');
  return context;
}
