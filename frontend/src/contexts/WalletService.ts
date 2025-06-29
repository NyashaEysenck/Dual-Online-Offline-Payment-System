import api from "@/utils/api";
import { Transaction, SendMoneyParams } from "./types";

export const fetchWalletData = async (email: string) => {
  try {
    // Get balance information
    const balanceRes = await api.post('/wallet/balance', { email });
    
    // Get transaction history
    const transactionRes = await api.get('/transactions/user', { 
      params: { email } 
    });

    return {
      balance: balanceRes.data.balance || 0,
      reservedBalance: balanceRes.data.reserved_Balance || 0,
      transactions: transactionRes.data.data || []
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    throw error;
  }
};

export const reserveTokens = async (amount: number, email: string) => {
  try {
    const response = await api.post('/wallet/reserve', { amount, email });
    return { 
      reservedBalance: response.data.reserved_Balance,
      balance: response.data.balance
    };
  } catch (error) {
    console.error('Error reserving tokens:', error);
    throw error;
  }
};

export const releaseTokens = async (amount: number, email: string) => {
  try {
    const response = await api.post('/wallet/release', { amount, email });
    return { 
      reservedBalance: response.data.reserved_Balance,
      balance: response.data.balance
    };
  } catch (error) {
    console.error('Error releasing tokens:', error);
    throw error;
  }
};

export const addTransaction = async (transaction: Omit<Transaction, "id" | "date">) => {
  try {
    const response = await api.post('/transactions', transaction);
    return { transaction: response.data };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const addFunds = async (amount: number, email: string) => {
  try {
    const response = await api.post('/wallet/deposit', { amount, email });
    return {
      balance: response.data.balance,
      transaction: response.data.transaction
    };
  } catch (error) {
    console.error('Error adding funds:', error);
    throw error;
  }
};

export const sendMoney = async ({ sender, amount, recipient, note, type }: SendMoneyParams) => {
  try {
    const response = await api.post('/transactions/transfer', {
      sender,
      amount,
      recipient,
      note,
      type
    });
    
    return {
      balance: response.data.balance,
      reservedBalance: response.data.reservedBalance || 0,
      transaction: response.data.transaction
    };
  } catch (error) {
    console.error('Error sending money:', error);
    throw error;
  }
};