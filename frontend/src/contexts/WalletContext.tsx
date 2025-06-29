import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";
import { useOfflineBalance } from "./OfflineBalanceContext";
import api from "@/utils/api";

interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  token_id?: string | null;
  status: "pending" | "completed" | "failed" | "conflict";
  created_at: Date;
  synced_at?: Date | null;
  sync_status: {
    sender_synced: boolean;
    receiver_synced: boolean;
  };
  offline_method?: "QR" | "Bluetooth" | null;
  transaction_type: "deposit" | "withdrawal" | "payment";
  note?: string | null;
}

interface SendMoneyParams {
  sender: string;
  amount: number;
  recipient: string;
  note?: string;
  type: "online" | "offline" | "qr" | "nfc" | "bluetooth";
}

interface WalletContextType {
  balance: number;
  reservedBalance: number;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  reserveTokens: (amount: number) => Promise<void>;
  releaseTokens: (amount: number) => Promise<void>;
  addFunds: (amount: number) => Promise<void>;
  sendMoney: (params: SendMoneyParams) => Promise<Transaction | null>;
  fetchWalletData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshUser } = useAuth();
  const { refreshOfflineBalance } = useOfflineBalance();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState(0);
  const [reservedBalance, setReservedBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    setError(defaultMessage);
    console.error(defaultMessage, err);
    toast({
      title: "Error",
      description: defaultMessage,
      variant: "destructive",
    });
  }, [toast]);

  const fetchWalletData = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch balance
      const balanceRes = await api.post('/wallet/balance', { email: user.email });
      setBalance(balanceRes.data.balance || 0);
      setReservedBalance(balanceRes.data.reserved_Balance || 0);

      // Fetch transactions
      const transactionRes = await api.get('/transactions/user', { 
        params: { email: user.email } 
      });
      setTransactions(transactionRes.data.data || []);
    } catch (err) {
      handleError(err, "Failed to fetch wallet data");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, handleError]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user, fetchWalletData]);

  const reserveTokens = useCallback(async (amount: number) => {
    if (!user?.email || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to reserve.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/wallet/reserve', { 
        amount, 
        email: user.email 
      });
      
      setReservedBalance(response.data.reserved_Balance || 0);
      await refreshUser();
      await refreshOfflineBalance();
      
      toast({
        title: "Tokens Reserved",
        description: `$${amount.toFixed(2)} has been reserved for offline use.`,
      });
    } catch (err) {
      handleError(err, "Failed to reserve tokens");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, handleError, toast, refreshUser, refreshOfflineBalance]);

  const releaseTokens = useCallback(async (amount: number) => {
    if (!user?.email || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to release.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/wallet/release', { 
        amount, 
        email: user.email 
      });
      
      setReservedBalance(response.data.reserved_Balance || 0);
      await refreshUser();
      await refreshOfflineBalance();
      
      toast({
        title: "Tokens Released",
        description: `$${amount.toFixed(2)} has been returned to your main balance.`,
      });
    } catch (err) {
      handleError(err, "Failed to release tokens");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, handleError, toast, refreshUser, refreshOfflineBalance]);

  const addFunds = useCallback(async (amount: number) => {
    if (!user?.email || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to deposit.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate deposit by updating balance directly
      const newBalance = balance + amount;
      setBalance(newBalance);
      
      await refreshUser();
      
      toast({
        title: "Deposit Successful",
        description: `$${amount.toFixed(2)} has been added to your account.`,
      });
    } catch (err) {
      handleError(err, "Failed to add funds");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, balance, handleError, toast, refreshUser]);

  const sendMoney = useCallback(async ({ sender, amount, recipient, note, type }: SendMoneyParams) => {
    if (!user?.email || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to send.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/transactions/transfer', {
        sender,
        amount,
        recipient,
        note,
        type
      });

      const transaction = response.data.transaction;
      setBalance(response.data.balance);
      setReservedBalance(response.data.reservedBalance || 0);
      
      if (transaction) {
        setTransactions(prev => [transaction, ...prev]);
      }

      await refreshUser();

      toast({
        title: "Payment Successful",
        description: `$${amount.toFixed(2)} sent to ${recipient}`,
      });

      return transaction;
    } catch (err) {
      handleError(err, "Failed to send money");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, handleError, toast, refreshUser]);

  return (
    <WalletContext.Provider value={{
      balance,
      reservedBalance,
      transactions,
      isLoading,
      error,
      reserveTokens,
      releaseTokens,
      addFunds,
      sendMoney,
      fetchWalletData
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};