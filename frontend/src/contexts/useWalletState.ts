import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import * as walletService from "./WalletService";
import { useAuth } from "./AuthContext";
import { useOfflineBalance } from "./OfflineBalanceContext";

import { Transaction, SendMoneyParams, WalletContextType } from "./types";

export const useWalletState = (): WalletContextType => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshOfflineBalance } = useOfflineBalance();
  const [balance, setBalance] = useState(0);
  const [reservedBalance, setReservedBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage;
    setError(errorMessage);
    console.error(defaultMessage, err);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  const fetchWalletData = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await walletService.fetchWalletData(user.email);
      setBalance(data.balance);
      setReservedBalance(data.reservedBalance);
      setTransactions(data.transactions || []);
    } catch (err) {
      handleError(err, "Failed to fetch wallet data");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchWalletData();
    }
  }, [fetchWalletData, user?.email]);

  const reserveTokens = useCallback(async (amount: number) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reserve tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to reserve",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { reservedBalance: newReservedBalance } = await walletService.reserveTokens(amount, user.email);
      setReservedBalance(newReservedBalance);
      setBalance(prev => prev - amount);
      
      // Refresh the offline balance to reflect the reserved tokens
      await refreshOfflineBalance();
      
      toast({
        title: "Tokens Reserved",
        description: `$${amount.toFixed(2)} has been reserved for offline use`,
      });
    } catch (err) {
      handleError(err, "Failed to reserve tokens");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast, refreshOfflineBalance, user?.email]);

  const releaseTokens = useCallback(async (amount: number) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to release tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to release",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { reservedBalance: newReservedBalance } = await walletService.releaseTokens(amount, user.email);
      setReservedBalance(newReservedBalance);
      setBalance(prev => prev + amount);
      
      // Refresh the offline balance to reflect the released tokens
      await refreshOfflineBalance();
      
      toast({
        title: "Tokens Released",
        description: `$${amount.toFixed(2)} has been returned to your main balance`,
      });
    } catch (err) {
      handleError(err, "Failed to release tokens");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast, refreshOfflineBalance, user?.email]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "date">) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add transactions",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { transaction: newTransaction } = await walletService.addTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      
      if (transaction.transaction_type !== "payment" || transaction.status === "completed") {
        const amountChange = transaction.amount;
        
        if (transaction.offline_method && transaction.amount < 0) {
          setReservedBalance(prev => Math.max(0, prev + amountChange));
        } else {
          setBalance(prev => prev + amountChange);
        }
      }

      toast({
        title: "Transaction Added",
        description: `${transaction.transaction_type === "deposit" ? "Received" : "Sent"} $${Math.abs(transaction.amount).toFixed(2)}`,
        variant: transaction.amount > 0 ? "default" : transaction.status === "failed" ? "destructive" : "default",
      });
    } catch (err) {
      handleError(err, "Failed to add transaction");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast, user?.email]);

  const addFunds = useCallback(async (amount: number) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add funds",
        variant: "destructive",
      });
      return;
    }
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to deposit",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { balance: newBalance, transaction } = await walletService.addFunds(amount, user.email);
      setBalance(newBalance);
      if (transaction) {
        setTransactions(prev => [transaction, ...prev]);
      }
      toast({
        title: "Deposit Successful",
        description: `$${amount.toFixed(2)} has been added to your account`,
      });
    } catch (err) {
      handleError(err, "Failed to add funds");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast, user?.email]);

  const sendMoney = useCallback(async ({ sender, amount, recipient, note, type }: SendMoneyParams) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send money",
        variant: "destructive",
      });
      return null;
    }
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to send",
        variant: "destructive",
      });
      return null;
    }
  
    setIsLoading(true);
    try {
      const { balance: newBalance, reservedBalance: newReservedBalance, transaction } = await walletService.sendMoney({
        sender,
        amount,
        recipient,
        note,
        type
      });
  
      if (!transaction) {
        throw new Error("Failed to process the transaction. No transaction data returned.");
      }
  
      setBalance(newBalance !== undefined ? newBalance : balance);
      setReservedBalance(newReservedBalance !== undefined ? newReservedBalance : reservedBalance);
      setTransactions(prev => [transaction, ...prev]);
  
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
  }, [handleError, toast, user?.email, balance, reservedBalance]);
  
  return {
    balance,
    reservedBalance,
    transactions,
    isLoading,
    error,
    reserveTokens,
    releaseTokens,
    addTransaction,
    addFunds,
    sendMoney,
    fetchWalletData
  };
};