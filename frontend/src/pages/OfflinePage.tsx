import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import WhiteCard from "@/components/WhiteCard";
import BalanceDisplay from "@/components/BalanceDisplay";
import GreenButton from "@/components/GreenButton";
import { useWallet } from "@/contexts/WalletContext";
import { useOfflineBalance } from "@/contexts/OfflineBalanceContext";
import { 
  CreditCard, 
  Lock, 
  Unlock, 
  QrCode, 
  ScanLine,
  Smartphone,
  Send
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const OfflinePage = () => {
  const { balance, reservedBalance, reserveTokens, releaseTokens } = useWallet();
  const { offlineBalance, pendingTransactions, refreshOfflineBalance } = useOfflineBalance();
  const [reserveAmount, setReserveAmount] = useState(20);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate available balance
  const availableBalance = balance;
  const maxReserveAmount = Math.min(500, Math.max(availableBalance, 0));

  // Refresh offline balance when component mounts
  useEffect(() => {
    refreshOfflineBalance();
  }, [refreshOfflineBalance]);

  const handleReserveTokens = async () => {
    if (reserveAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to reserve",
        variant: "destructive"
      });
      return;
    }
    
    if (reserveAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to reserve this amount",
        variant: "destructive"
      });
      return;
    }
    
    await reserveTokens(reserveAmount);
    setReserveAmount(Math.min(20, maxReserveAmount - reserveAmount));
  };

  const handleReleaseTokens = async () => {
    if (reserveAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to release",
        variant: "destructive"
      });
      return;
    }
    
    if (reserveAmount > reservedBalance) {
      toast({
        title: "Insufficient Reserved Balance",
        description: "You don't have enough reserved funds to release this amount",
        variant: "destructive"
      });
      return;
    }
    
    await releaseTokens(reserveAmount);
    setReserveAmount(Math.min(20, maxReserveAmount + reserveAmount));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark">Offline Transactions</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Balance Summary */}
          <WhiteCard className="p-6">
            <h2 className="text-xl font-semibold text-dark mb-6">Your Balances</h2>
            <div className="space-y-4">
              <BalanceDisplay 
                amount={availableBalance} 
                label="Available Online" 
                type="primary" 
              />
              <BalanceDisplay 
                amount={reservedBalance} 
                label="Reserved for Offline" 
                type="reserved" 
              />
              <BalanceDisplay 
                amount={offlineBalance} 
                label="Current Offline Balance" 
                type="secondary" 
              />
              {pendingTransactions > 0 && (
                <div className="text-sm text-amber-600 mt-2">
                  You have {pendingTransactions} pending offline {pendingTransactions === 1 ? 'transaction' : 'transactions'} to be synced
                </div>
              )}
            </div>
          </WhiteCard>

          {/* Token Management */}
          <WhiteCard className="p-6">
            <h2 className="text-xl font-semibold text-dark mb-4">Token Management</h2>
            <p className="text-dark-lighter text-sm mb-6">
              Reserve funds for offline payments when you don't have internet access.
            </p>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-dark">Amount to Reserve/Release</Label>
                <Slider
                  value={[reserveAmount]}
                  max={Math.max(500, maxReserveAmount, reservedBalance)}
                  step={5}
                  onValueChange={(value) => setReserveAmount(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-dark-lighter">
                  <span>$0</span>
                  <span>${reserveAmount.toFixed(2)}</span>
                  <span>$500</span>
                </div>
              </div>

              <div className="flex gap-3">
                <GreenButton 
                  onClick={handleReserveTokens}
                  className="flex-1 flex items-center justify-center gap-1"
                  disabled={availableBalance <= 0 || reserveAmount <= 0 || reserveAmount > availableBalance}
                >
                  <Lock size={16} />
                  Reserve Tokens
                </GreenButton>
                <GreenButton 
                  variant="secondary"
                  onClick={handleReleaseTokens}
                  className="flex-1 flex items-center justify-center gap-1"
                  disabled={reservedBalance <= 0 || reserveAmount <= 0 || reserveAmount > reservedBalance}
                >
                  <Unlock size={16} />
                  Release Tokens
                </GreenButton>
              </div>
            </div>
          </WhiteCard>
        </div>

        {/* Offline Actions */}
        <WhiteCard className="p-6">
          <h2 className="text-xl font-semibold text-dark mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate("/request")}
              className="group p-6 rounded-lg border border-gray-200 hover:border-greenleaf-300 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenleaf-100 flex items-center justify-center group-hover:bg-greenleaf-200 transition-colors">
                  <QrCode size={24} className="text-greenleaf-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Create request</h3>
                  <p className="text-sm text-dark-lighter">
                    Generate a payment request QR code
                  </p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate("/send")}
              className="group p-6 rounded-lg border border-gray-200 hover:border-greenleaf-300 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenleaf-100 flex items-center justify-center group-hover:bg-greenleaf-200 transition-colors">
                  <ScanLine size={24} className="text-greenleaf-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Scan to pay</h3>
                  <p className="text-sm text-dark-lighter">
                    Scan a payment request QR code
                  </p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate("/offline-server")}
              className="group p-6 rounded-lg border border-gray-200 hover:border-greenleaf-300 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenleaf-100 flex items-center justify-center group-hover:bg-greenleaf-200 transition-colors">
                  <Smartphone size={24} className="text-greenleaf-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Start Payment Server</h3>
                  <p className="text-sm text-dark-lighter">
                    Create a payment server for others to connect
                  </p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate("/offline-client")}
              className="group p-6 rounded-lg border border-gray-200 hover:border-greenleaf-300 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenleaf-100 flex items-center justify-center group-hover:bg-greenleaf-200 transition-colors">
                  <Send size={24} className="text-greenleaf-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Connect to Payment Server</h3>
                  <p className="text-sm text-dark-lighter">
                    Connect to a payment server and make payments
                  </p>
                </div>
              </div>
            </button>
          </div>
        </WhiteCard>

        {/* Educational Section */}
        <WhiteCard className="p-6 bg-greenleaf-50 border-none">
          <div className="flex items-start">
            <div className="mr-4 mt-1">
              <CreditCard size={24} className="text-greenleaf-600" />
            </div>
            <div>
              <h3 className="font-semibold text-dark">How Offline Payments Work</h3>
              <p className="text-dark-lighter text-sm mt-1">
                When you reserve tokens, you're setting aside funds specifically for offline use. 
                These tokens are cryptographically signed and can be transferred via QR codes 
                even without an internet connection. Once you're back online, 
                the transactions will automatically sync with our servers.
              </p>
              <h4 className="font-semibold text-dark mt-3">Dual-Save Offline Transactions</h4>
              <p className="text-dark-lighter text-sm mt-1">
                Our dual-save feature allows two devices to transact completely offline:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-dark-lighter">
                <li>Device A starts a Wi-Fi hotspot and hosts a local payment server</li>
                <li>Device B connects to the hotspot and scans the QR code</li>
                <li>Both devices save the same transaction receipt to their local storage</li>
                <li>No internet connection required - works completely offline!</li>
              </ul>
            </div>
          </div>
        </WhiteCard>
      </div>
    </Layout>
  );
};

export default OfflinePage;