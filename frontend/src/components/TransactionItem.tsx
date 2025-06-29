import { cn } from "@/lib/utils";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { format } from "date-fns";

interface TransactionItemProps {
  transaction: {
    transaction_id: string;
    amount: number;
    note?: string | null;
    created_at: string | Date;
    status: "pending" | "completed" | "failed" | "conflict";
    offline_method?: "QR" | "Bluetooth" | null;
    transaction_type: "deposit" | "withdrawal" | "payment";
    sender_id?: string;
    receiver_id?: string;
  };
  currentUserId?: string;
  showDate?: boolean;
  onClick?: () => void;
}

const TransactionItem = ({
  transaction,
  currentUserId,
  onClick,
  showDate = false,
}: TransactionItemProps) => {
  const {
    transaction_id,
    amount,
    note,
    created_at,
    status,
    offline_method,
    transaction_type,
    sender_id,
    receiver_id,
  } = transaction;

  // Determine if this is an incoming or outgoing transaction
  const isIncoming = currentUserId ? receiver_id === currentUserId : amount > 0;
  
  // Format date to display in a readable format
  const transactionDate = new Date(created_at);
  const formattedDate = showDate 
    ? format(transactionDate, "MMM d, yyyy") 
    : format(transactionDate, "MMM d");

  // Icon based on transaction type and direction
  const getIcon = () => {
    if (transaction_type === "deposit") {
      return <ArrowDownLeft className="text-green-500" />;
    }
    if (transaction_type === "withdrawal") {
      return <ArrowUpRight className="text-red-500" />;
    }
    // For payment type, show direction based on current user
    if (transaction_type === "payment") {
      return isIncoming 
        ? <ArrowDownLeft className="text-green-500" /> 
        : <ArrowUpRight className="text-red-500" />;
    }
    return <CreditCard className="text-gray-500" />;
  };

  // Status icon
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-greenleaf-500" />;
      case "pending":
        return <Clock size={16} className="text-amber-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
      case "conflict":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  // Determine display amount (positive for incoming, negative for outgoing)
  const displayAmount = Math.abs(amount);
  const description = note || (transaction_type === "payment" 
    ? (isIncoming ? "Received payment" : "Sent payment")
    : transaction_type);

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg transition-colors",
        {
          "hover:bg-gray-50 cursor-pointer": onClick,
          "bg-greenleaf-50": offline_method,
        }
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
          {getIcon()}
        </div>
        <div>
          <div className="font-medium text-dark">{description}</div>
          <div className="text-xs text-dark-lighter flex items-center">
            {formattedDate}
            {offline_method && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-greenleaf-100 text-greenleaf-800">
                Offline
              </span>
            )}
            <span className="mx-1.5">•</span>
            <span className="flex items-center gap-1">
              {getStatusIcon()}
              {status}
            </span>
          </div>
        </div>
      </div>
      <div className={cn(
        "font-semibold",
        {
          "text-green-600": isIncoming,
          "text-red-600": !isIncoming,
        }
      )}>
        {isIncoming ? "+" : "-"}${displayAmount.toFixed(2)}
      </div>
    </div>
  );
};

export default TransactionItem;