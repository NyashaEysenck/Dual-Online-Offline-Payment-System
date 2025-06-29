import { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsQR from "jsqr";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

const QrScanner = ({ onScan, onError, onCancel }: QRScannerProps) => {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastScanRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const startScanner = async () => {
    setScanning(true);
    setError(null);
    lastScanRef.current = null;
    lastScanTimeRef.current = 0;

    try {
      const constraints = { 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err) {
      const errorMessage = "Unable to access camera. Please ensure camera permissions are granted.";
      setError(errorMessage);
      setScanning(false);
      onError(new Error(errorMessage));
    }
  };

  const stopScanner = () => {
    cancelAnimationFrame(animationFrameRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    onCancel();
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    // If QR code found
    if (code) {
      const now = Date.now();
      // Debounce scan - prevent multiple scans of the same code within 3 seconds
      if (
        lastScanRef.current !== code.data || 
        now - lastScanTimeRef.current > 3000
      ) {
        lastScanRef.current = code.data;
        lastScanTimeRef.current = now;
        
        // Process the QR code data
        onScan(code.data);
        stopScanner();
        return;
      }
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        {scanning ? (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              autoPlay 
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-greenleaf-500 rounded-lg opacity-50">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-greenleaf-500 rounded-lg"></div>
              
              {/* Scanning indicator */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-greenleaf-500 opacity-70 animate-scanline"></div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Camera size={48} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Camera is inactive</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
      )}

      <Button 
        onClick={stopScanner} 
        variant="default"
        className="bg-greenleaf-500 hover:bg-greenleaf-600 text-white"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Stop Scanner
      </Button>
    </div>
  );
};

export default QrScanner;