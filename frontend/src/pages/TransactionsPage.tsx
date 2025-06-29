import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import WhiteCard from "@/components/WhiteCard";
import TransactionItem from "@/components/TransactionItem";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Filter, 
  Search, 
  Calendar, 
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TransactionsPage = () => {
  const { transactions } = useWallet();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all-time");

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        // Filter by search term
        if (searchTerm && !tx.note?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by type
        if (filterType !== "all" && tx.transaction_type !== filterType) {
          return false;
        }
        
        // Filter by date
        if (filterDate !== "all-time") {
          const now = new Date();
          const txDate = new Date(tx.created_at);
          
          if (filterDate === "today" && 
              !(txDate.getDate() === now.getDate() && 
                txDate.getMonth() === now.getMonth() && 
                txDate.getFullYear() === now.getFullYear())) {
            return false;
          }
          
          if (filterDate === "this-week") {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            if (txDate < startOfWeek) return false;
          }
          
          if (filterDate === "this-month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            if (txDate < startOfMonth) return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions, searchTerm, filterType, filterDate]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterDate("all-time");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark">Transaction History</h1>
        
        {/* Filters */}
        <WhiteCard className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3 top-2.5 text-dark-lighter" />
              <Input
                placeholder="Search transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Select 
                value={filterType} 
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter size={16} className="mr-1" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filterDate} 
                onValueChange={setFilterDate}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Calendar size={16} className="mr-1" />
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="text-dark-lighter mb-2 sm:mb-0">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              {(searchTerm || filterType !== "all" || filterDate !== "all-time") && (
                <Button 
                  variant="link" 
                  className="ml-2 h-auto p-0 text-greenleaf-600"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download size={16} />
              Export
            </Button>
          </div>
          
          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionItem 
                  key={transaction.transaction_id} 
                  transaction={transaction}
                  currentUserId={user?._id}
                  showDate
                />
              ))
            ) : (
              <div className="text-center py-12 text-dark-lighter">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p>No transactions found</p>
                {(searchTerm || filterType !== "all" || filterDate !== "all-time") && (
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                )}
              </div>
            )}
          </div>
        </WhiteCard>
      </div>
    </Layout>
  );
};

export default TransactionsPage;