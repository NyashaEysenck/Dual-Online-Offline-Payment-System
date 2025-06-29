import { useState, useEffect } from "react";

export const useNFC = () => {
  const [isNFCAvailable, setIsNFCAvailable] = useState(false);

  // Check if NFC is available
  useEffect(() => {
    setIsNFCAvailable('NDEFReader' in window);
  }, []);

  const initNFC = async () => {
    if (!isNFCAvailable) {
      return false;
    }
    
    try {
      // Just check if we can create an NDEFReader instance
      // @ts-ignore - TypeScript doesn't have NDEFReader types by default
      new window.NDEFReader();
      return true;
    } catch (err) {
      console.error("NFC initialization error:", err);
      return false;
    }
  };

  const sendViaNFC = async (data: string) => {
    if (!isNFCAvailable) {
      return false;
    }
    
    try {
      // @ts-ignore - NDEFReader not in TS types
      const writer = new window.NDEFReader();
      await writer.write({
        records: [{ recordType: "text", data }]
      });
      return true;
    } catch (err) {
      console.error("NFC write error:", err);
      return false;
    }
  };

  const readFromNFC = async (): Promise<string | null> => {
    if (!isNFCAvailable) {
      return null;
    }
    
    try {
      // @ts-ignore - NDEFReader not in TS types
      const reader = new window.NDEFReader();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("NFC read timeout"));
        }, 30000); // 30 second timeout
        
        reader.addEventListener("reading", (event: any) => {
          clearTimeout(timeout);
          
          if (event.message && event.message.records) {
            for (const record of event.message.records) {
              if (record.recordType === "text" && record.data) {
                const textDecoder = new TextDecoder();
                const text = textDecoder.decode(record.data);
                resolve(text);
                return;
              }
            }
          }
          
          // If we got here, no valid data was found
          reject(new Error("No valid data found in NFC tag"));
        });
        
        reader.addEventListener("readingerror", (error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
        
        reader.scan().catch((err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch (err) {
      console.error("NFC read error:", err);
      return null;
    }
  };

  return { initNFC, sendViaNFC, readFromNFC, isNFCAvailable };
};