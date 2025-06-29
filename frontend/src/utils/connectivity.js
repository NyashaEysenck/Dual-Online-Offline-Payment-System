import api from './api';
import { syncOfflineTransactions, confirmPendingTransactions } from '@/services/syncService';
import { toast } from '@/components/ui/use-toast';

/**
 * Checks if the online backend server is accessible
 * @returns {Promise<boolean>} True if online, false if offline
 */
export const checkOnlineStatus = async () => {
  try {
    const response = await api.get('/health', { 
      timeout: 3000,
      validateStatus: () => true
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.log('Online check failed:', error.message);
    return false;
  }
};

/**
 * Syncs transactions when going from offline to online
 */
export const handleConnectionChange = async (isOnline, wasOnline, indexedDB, refreshOfflineBalance) => {
  if (isOnline && !wasOnline && indexedDB) {
    try {
      const transactions = await indexedDB.getAllItems();
      
      const { synced, pending, failed } = await syncOfflineTransactions(
        transactions,
        indexedDB.updateItem,
        indexedDB.deleteItem,
        refreshOfflineBalance
      );
      
      const confirmed = await confirmPendingTransactions(
        transactions,
        indexedDB.deleteItem,
        refreshOfflineBalance
      );
      
      if (synced > 0 || pending > 0 || confirmed > 0) {
        toast({
          variant: "default",
          title: "Transactions Synced",
          description: `${synced} completed, ${pending} pending, ${confirmed} confirmed`,
          duration: 5000,
        });
      }
      
      if (failed > 0) {
        toast({
          variant: "destructive",
          title: "Sync Issues",
          description: `${failed} transactions failed to sync`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error during transaction sync:', error);
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to sync transactions. Will try again later.",
        duration: 5000,
      });
    }
  }
};

/**
 * Periodically checks online status and calls the provided callback when status changes
 */
export const startOnlineStatusMonitor = (onStatusChange, indexedDB, refreshOfflineBalance, interval = 10000) => {
  let lastStatus = null;
  let timerId = null;
  
  const checkStatus = async () => {
    const isOnline = await checkOnlineStatus();
    
    if (lastStatus === null || lastStatus !== isOnline) {
      onStatusChange(isOnline);
      
      if (indexedDB) {
        await handleConnectionChange(isOnline, lastStatus, indexedDB, refreshOfflineBalance);
      }
      
      lastStatus = isOnline;
    }
  };
  
  checkStatus();
  timerId = setInterval(checkStatus, interval);
  
  return () => {
    if (timerId) {
      clearInterval(timerId);
    }
  };
};