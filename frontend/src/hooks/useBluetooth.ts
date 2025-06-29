import { useState, useEffect } from "react";

export const useBluetooth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.bluetooth) {
      setIsSupported(false);
      setError("Bluetooth API not supported");
      return;
    }

    setIsSupported(true);
    checkBluetoothAvailability();
  }, []);

  const checkBluetoothAvailability = async () => {
    try {
      const available = await navigator.bluetooth.getAvailability();
      setIsAvailable(available);
      
      navigator.bluetooth.addEventListener('availabilitychanged', (event: any) => {
        setIsAvailable(event.value);
      });
    } catch (err) {
      setError("Failed to check Bluetooth availability");
    }
  };

  const requestDevice = async (options: RequestDeviceOptions) => {
    if (!isSupported) {
      throw new Error("Bluetooth is not supported on this device");
    }
    
    try {
      return await navigator.bluetooth.requestDevice(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to request Bluetooth device";
      throw new Error(errorMessage);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to device");
      return server;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to Bluetooth device";
      throw new Error(errorMessage);
    }
  };

  return {
    isSupported,
    isAvailable,
    error,
    requestDevice,
    connectToDevice
  };
};