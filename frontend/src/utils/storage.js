const DB_NAME = 'AuthDB';
const STORE_NAME = 'users';

// Connection pooling
let dbConnection = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbConnection) {
      resolve(dbConnection);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'email' });
      }
    };

    request.onsuccess = () => {
      dbConnection = request.result;
      dbConnection.onclose = () => { dbConnection = null; };
      dbConnection.onerror = (event) => {
        console.error("Database error:", event.target.error);
        dbConnection = null;
      };
      resolve(dbConnection);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const saveUser = async (email, user) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const userToStore = {
        email: email,
        crypto_salt: user.crypto_salt,
        encryptedData: user.encryptedData,
        // Store JWT token
        token: localStorage.getItem('authToken')
      };
      
      const request = store.put(userToStore);
      
      request.onsuccess = () => resolve(userToStore);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const getUser = async (email) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(email);
      
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        // If we have a token in storage, update localStorage
        if (request.result.token) {
          localStorage.setItem('authToken', request.result.token);
        }
        
        resolve({
          email: request.result.email,
          crypto_salt: request.result.crypto_salt,
          encryptedData: request.result.encryptedData
        });
      };
      
      request.onerror = () => {
        console.error("Error getting user:", request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return null;
  }
};

export const clearUserStorage = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        // Also clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('lastEmail');
        sessionStorage.removeItem('sessionUser');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error clearing user storage:", error);
    throw error;
  }
};

// Helper function to list all users (for debugging)
export const debugListAllUsers = async () => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      console.log('All users in database:', request.result);
      resolve(request.result);
    };
  });
};