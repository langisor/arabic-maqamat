export const RECORDING_DB_NAME = 'arabic-maqamat-recordings';
export const RECORDING_DB_VERSION = 1;
const RECORDING_STORE = 'takes';

export interface StoredRecording {
  id: string;
  title: string;
  maqamId: string;
  maqamName: string;
  createdAt: string;
  durationSeconds: number;
  mimeType: string;
  blob: Blob;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Recording storage is unavailable in this browser.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECORDING_DB_NAME, RECORDING_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDING_STORE)) {
        db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open recording storage.'));
    request.onblocked = () => reject(new Error('Recording storage upgrade is blocked by another tab.'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(RECORDING_STORE, mode);
    const request = action(transaction.objectStore(RECORDING_STORE));
    let result: T | undefined;
    let requestSucceeded = false;
    request.onsuccess = () => {
      result = request.result;
      requestSucceeded = true;
    };
    request.onerror = () => reject(request.error ?? new Error('Recording storage request failed.'));
    transaction.oncomplete = () => {
      db.close();
      if (requestSucceeded) resolve(result as T);
      else reject(new Error('Recording storage transaction completed without a result.'));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error('Recording storage transaction failed.'));
    };
    transaction.onerror = () => reject(transaction.error ?? new Error('Recording storage transaction failed.'));
  });
}

export const RecordingStorage = {
  async list(): Promise<StoredRecording[]> {
    const recordings = await withStore('readonly', (store) => store.getAll());
    return recordings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  put(recording: StoredRecording): Promise<IDBValidKey> {
    return withStore('readwrite', (store) => store.put(recording));
  },
  delete(id: string): Promise<undefined> {
    return withStore('readwrite', (store) => store.delete(id));
  }
};
