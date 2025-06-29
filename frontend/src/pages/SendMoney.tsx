import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, QrCode, Nfc, Bluetooth } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import GreenButton from "@/components/GreenButton";
import { useAuth } from "@/contexts/AuthContext";
import { decryptData, deriveMasterKey } from '@/utils/crypto';
import WhiteCard from "@/components/WhiteCard";
import { useWallet } from "@/contexts/WalletContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNFC } from "@/hooks/useNFC";
import { useBluetooth } from "@/hooks/useBluetooth";
import QRScanner from "@/components/QRScanner";

const SendMoney = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMoney, isLoading } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState<"type" | "scan" | "manual" | "confirm" | "success">("type");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [scanning, setScanning] = useState(false);
  const { initNFC, readFromNFC } = useNFC();
  const { isSupported: isBluetoothSupported } = useBluetooth();

  // Initialize NFC
  useEffect(() => {
    const setupNFC = async () => {
      try {
        await initNFC();
      } catch (err) {
        console.error("NFC initialization error:", err);
      }
    };
    
    setupNFC();
  }, [initNFC]);

  const handleQRScan = async (data: string) => {
    try {
      await processPaymentData(data);
      setScanning(false);
    } catch (err) {
      console.error('QR scan error:', err);
      setError("Invalid QR code. Please try again.");
      toast({
        title: "QR Scan Failed",
        description: "The QR code does not contain valid payment request data",
        variant: "destructive",
      });
    }
  };

  const processPaymentData = async (data: string) => {
    if (!user?.crypto_salt) throw new Error("User salt not available");

    // Try to decrypt with different keys
    const encryptionKeys = [
      import.meta.env.VITE_QR_ENCRYPTION_SECRET,
      import.meta.env.VITE_NFC_ENCRYPTION_SECRET,
      import.meta.env.VITE_BLUETOOTH_ENCRYPTION_SECRET
    ];

    const salts = [
      import.meta.env.VITE_QR_SALT,
      import.meta.env.VITE_NFC_SALT,
      import.meta.env.VITE_BLUETOOTH_SALT
    ];

    for (let i = 0; i < encryptionKeys.length; i++) {
      try {
        const encryptionKey = deriveMasterKey(encryptionKeys[i], salts[i]);
        const decrypted = decryptData(data, encryptionKey);
        
        if (decrypted && decrypted.recipient && decrypted.amount) {
          setPaymentData(decrypted);
          setStep("confirm");
          return;
        }
      } catch (e) {
        console.log(`Failed to decrypt with key ${i}`);
      }
    }

    // Fallback to plain JSON
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.recipient && parsedData.amount) {
        setPaymentData(parsedData);
        setStep("confirm");
      } else {
        throw new Error("Invalid data format");
      }
    } catch (err) {
      throw new Error("Invalid payment request data format");
    }
  };

  const handleManualEntrySubmit = () => {
    try {
      if (!manualEntry.trim()) {
        throw new Error("Please enter payment data");
      }
      processPaymentData(manualEntry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid payment data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCompletePayment = async () => {
    try {
      if (!paymentData || !user?.email) {
        throw new Error("Invalid payment data");
      }

      setIsSending(true);
      
      const result = await sendMoney({
        sender: user.email,
        amount: paymentData.amount,
        recipient: paymentData.recipient,
        note: paymentData.note || "",
        type: paymentData.type || "qr"
      });

      if (result === null) {
        throw new Error("Transaction failed");
      }

      setStep("success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete payment";
      setError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setPaymentData(null);
    setManualEntry("");
    setStep("type");
    setError(null);
    setScanning(false);
  };

  return (
    <Layout>
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          {step !== "type" && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => step === "success" ? resetForm() : setStep("type")}
              className="text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-bold text-dark">
            {step === "type" ? "Send Money" : 
             step === "scan" ? "Scan Payment Request" : 
             step === "manual" ? "Enter Payment Data" :
             step === "confirm" ? "Confirm Payment" : "Payment Complete"}
          </h1>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === "type" && (
            <WhiteCard className="p-6">
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-dark">Select Payment Method</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setStep("scan")}
                    className="p-6 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <QrCode size={24} className="text-greenleaf-600" />
                      <div>
                        <h3 className="font-medium text-dark">Scan QR Code</h3>
                        <p className="text-sm text-dark-lighter">Scan a QR code from the recipient's device</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setStep("manual")}
                    className="p-6 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-greenleaf-100 flex items-center justify-center">
                        <span className="text-greenleaf-600 font-semibold">#</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-dark">Manual Entry</h3>
                        <p className="text-sm text-dark-lighter">Enter payment request data manually</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </WhiteCard>
          )}

          {step === "scan" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">Scan Payment Request</h2>
                <p className="text-gray-600">Scan a QR code to process payment</p>
              </div>

              {scanning ? (
                <div className="w-full max-w-md">
                  <QRScanner 
                    onScan={handleQRScan} 
                    onError={(err) => {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: err.message
                      });
                      setScanning(false);
                    }}
                    onCancel={() => setScanning(false)}
                  />
                </div>
              ) : (
                <Button
                  onClick={() => setScanning(true)}
                  className="bg-greenleaf-500 hover:bg-greenleaf-600 text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Button>
              )}
            </div>
          )}

          {step === "manual" && (
            <WhiteCard className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Request Data</Label>
                    <Textarea
                      value={manualEntry}
                      onChange={(e) => setManualEntry(e.target.value)}
                      placeholder="Paste the payment request data here (encrypted or JSON format)"
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("type")}
                  >
                    Back
                  </Button>
                  <GreenButton 
                    onClick={handleManualEntrySubmit}
                    disabled={!manualEntry.trim()}
                  >
                    Submit Payment Data
                  </GreenButton>
                </div>
              </div>
            </WhiteCard>
          )}

          {step === "confirm" && paymentData && (
            <WhiteCard className="flex-1 flex flex-col">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-dark mb-2 text-center">
                  Confirm Payment
                </h2>
                
                <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex justify-between">
                    <span className="text-dark-lighter">Amount</span>
                    <span className="font-semibold text-dark">${paymentData.amount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-dark-lighter">To</span>
                    <span className="font-semibold text-dark">
                      {paymentData.recipient}
                    </span>
                  </div>
                  
                  {paymentData.note && (
                    <div className="pt-3 border-t">
                      <span className="text-dark-lighter block mb-1">Note</span>
                      <span className="text-dark">{paymentData.note}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("type")}
                  >
                    Cancel
                  </Button>
                  <GreenButton 
                    onClick={handleCompletePayment}
                    disabled={isSending || isLoading}
                  >
                    {isSending || isLoading ? "Processing..." : "Send Payment"}
                  </GreenButton>
                </div>
              </div>
            </WhiteCard>
          )}

          {step === "success" && (
            <WhiteCard className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-greenleaf-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-greenleaf-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-semibold text-dark">
                  Payment Sent!
                </h2>
                
                <p className="text-dark-lighter">
                  You've sent ${paymentData?.amount?.toFixed(2)} to {paymentData?.recipient}.
                </p>
                
                <div className="flex gap-4 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                  <GreenButton onClick={resetForm}>
                    Send Another Payment
                  </GreenButton>
                </div>
              </div>
            </WhiteCard>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SendMoney;