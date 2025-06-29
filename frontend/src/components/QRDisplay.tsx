import { useEffect, useState, useMemo } from "react";
import WhiteCard from "./WhiteCard";
import GreenButton from "./GreenButton";
import { Clock, Copy as CopyIcon, ShieldCheck } from "lucide-react";
import QRCode from "react-qr-code";

interface QRDisplayProps {
  encryptedValue: string;
  amount: number;
  expiresIn?: number;
  isSecure?: boolean;
}

const QRDisplay = ({ 
  encryptedValue, 
  amount, 
  expiresIn = 300,
  isSecure = true
}: QRDisplayProps) => {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [copied, setCopied] = useState(false);
  const [clipboardPermission, setClipboardPermission] = useState<PermissionState | null>(null);

  // Check clipboard permissions (modern browsers)
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({
            name: "clipboard-write" as PermissionName
          });
          setClipboardPermission(status.state);
          status.onchange = () => setClipboardPermission(status.state);
        }
      } catch (err) {
        console.log("Clipboard permission API not supported");
      }
    };
    checkPermissions();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLeft]);

  const copyToClipboard = async () => {
    if (!encryptedValue) {
      console.error("No data to copy");
      return;
    }

    try {
      // Modern clipboard API (requires secure context)
      await navigator.clipboard.writeText(encryptedValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.log("Modern clipboard failed, trying fallback...");

      // Fallback 1: Document.execCommand (deprecated but widely supported)
      const textArea = document.createElement("textarea");
      textArea.value = encryptedValue;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        const success = document.execCommand("copy");
        if (!success) throw new Error("execCommand failed");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
        
        // Fallback 2: Prompt user to copy manually
        alert(`Press Ctrl+C to copy:\n\n${encryptedValue}`);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Format time remaining
  const formattedTimeLeft = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const memoizedQR = useMemo(() => (
    <div className="mb-4 p-4 bg-white rounded-lg">
      <QRCode
        value={encryptedValue}
        size={256}
        bgColor="#FFFFFF"
        fgColor="#4CAF50"
        level="L"
      />
    </div>
  ), [encryptedValue]);

  return (
    <div className="flex flex-col items-center max-w-xs mx-auto">
      {memoizedQR}
      
      {timeLeft > 0 && (
        <div className="w-full mb-4 flex items-center justify-center text-sm text-gray-600">
          <Clock size={14} className="mr-1" />
          <span>Expires in {formattedTimeLeft}</span>
        </div>
      )}
      
      {timeLeft === 0 && (
        <div className="w-full mb-4 p-2 bg-red-50 text-red-600 text-sm rounded text-center">
          This QR code has expired. Please generate a new one.
        </div>
      )}
      
      <GreenButton 
        onClick={copyToClipboard}
        className="w-full"
        disabled={timeLeft === 0}
      >
        <CopyIcon size={16} className="mr-2" />
        {copied ? "Copied!" : "Copy Encrypted Data"}
      </GreenButton>
      
      {isSecure && (
        <div className="mt-4 flex items-center justify-center text-xs text-greenleaf-600">
          <ShieldCheck size={14} className="mr-1" />
          <span>Secure encrypted payment data</span>
        </div>
      )}
    </div>
  );
};

export default QRDisplay;