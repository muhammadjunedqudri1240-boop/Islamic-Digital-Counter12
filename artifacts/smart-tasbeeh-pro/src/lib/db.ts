export interface HistoryEntry {
  id?: number;
  zikrName: string;
  count: number;
  target: number;
  targetCompleted: boolean;
  date: string;
  time: string;
  duration: number;
  notes: string;
  timestamp: number;
}

export interface SavedSession {
  id?: number;
  zikrName: string;
  count: number;
  target: number;
  notes: string;
  createdAt: number;
}

export interface NotificationEntry {
  id?: number;
  title: string;
  time: string;
  sound: string;
  repeatDaily: boolean;
  repeatWeekly: boolean;
  enabled: boolean;
  days?: number[];
}

export interface AppSettings {
  id?: number;
  theme: string;
  soundType: number;
  volume: number;
  vibration: boolean;
  darkMode: boolean;
  fontSize: string;
  language: string;
  autoSave: boolean;
  displayStyle: string;
  counterSkin: string;
  buttonStyle: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  createdAt: number;
}

const DB_NAME = "SmartTasbeehPro";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("history")) {
        const historyStore = db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
        historyStore.createIndex("timestamp", "timestamp");
        historyStore.createIndex("zikrName", "zikrName");
        historyStore.createIndex("date", "date");
      }

      if (!db.objectStoreNames.contains("savedSessions")) {
        const sessionsStore = db.createObjectStore("savedSessions", { keyPath: "id", autoIncrement: true });
        sessionsStore.createIndex("zikrName", "zikrName");
        sessionsStore.createIndex("createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains("notifications")) {
        db.createObjectStore("notifications", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }
    };
  });
}

function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = action(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      })
  );
}

export const db = {
  history: {
    add: (entry: Omit<HistoryEntry, "id">) =>
      transaction<number>("history", "readwrite", (store) => store.add(entry) as IDBRequest<number>),
    getAll: () => getAllFromStore<HistoryEntry>("history"),
    delete: (id: number) =>
      transaction<undefined>("history", "readwrite", (store) => store.delete(id) as IDBRequest<undefined>),
    clear: () =>
      transaction<undefined>("history", "readwrite", (store) => store.clear() as IDBRequest<undefined>),
  },

  savedSessions: {
    add: (session: Omit<SavedSession, "id">) =>
      transaction<number>("savedSessions", "readwrite", (store) => store.add(session) as IDBRequest<number>),
    getAll: () => getAllFromStore<SavedSession>("savedSessions"),
    delete: (id: number) =>
      transaction<undefined>("savedSessions", "readwrite", (store) => store.delete(id) as IDBRequest<undefined>),
    update: (session: SavedSession) =>
      transaction<number>("savedSessions", "readwrite", (store) => store.put(session) as IDBRequest<number>),
  },

  notifications: {
    add: (notif: Omit<NotificationEntry, "id">) =>
      transaction<number>("notifications", "readwrite", (store) => store.add(notif) as IDBRequest<number>),
    getAll: () => getAllFromStore<NotificationEntry>("notifications"),
    delete: (id: number) =>
      transaction<undefined>("notifications", "readwrite", (store) => store.delete(id) as IDBRequest<undefined>),
    update: (notif: NotificationEntry) =>
      transaction<number>("notifications", "readwrite", (store) => store.put(notif) as IDBRequest<number>),
  },

  settings: {
    get: async (): Promise<AppSettings> => {
      const result = await transaction<AppSettings | undefined>(
        "settings",
        "readonly",
        (store) => store.get(1) as IDBRequest<AppSettings | undefined>
      );
      return result ?? defaultSettings;
    },
    save: (settings: AppSettings) =>
      transaction<number>("settings", "readwrite", (store) => store.put({ ...settings, id: 1 }) as IDBRequest<number>),
  },

  profile: {
    get: async (): Promise<UserProfile> => {
      const result = await transaction<UserProfile | undefined>(
        "profile",
        "readonly",
        (store) => store.get(1) as IDBRequest<UserProfile | undefined>
      );
      return result ?? { id: 1, name: "", createdAt: Date.now() };
    },
    save: (profile: UserProfile) =>
      transaction<number>("profile", "readwrite", (store) => store.put({ ...profile, id: 1 }) as IDBRequest<number>),
  },
};

export const defaultSettings: AppSettings = {
  id: 1,
  theme: "golden",
  soundType: 0,
  volume: 70,
  vibration: true,
  darkMode: true,
  fontSize: "medium",
  language: "en",
  autoSave: true,
  displayStyle: "digital",
  counterSkin: "metallic",
  buttonStyle: "circular",
};

export function exportData(): Promise<string> {
  return Promise.all([
    db.history.getAll(),
    db.savedSessions.getAll(),
    db.settings.get(),
    db.profile.get(),
    db.notifications.getAll(),
  ]).then(([history, savedSessions, settings, profile, notifications]) => {
    return JSON.stringify({ history, savedSessions, settings, profile, notifications, exportedAt: Date.now() }, null, 2);
  });
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  if (data.history) {
    for (const entry of data.history) {
      const { id: _id, ...rest } = entry;
      await db.history.add(rest);
    }
  }
  if (data.savedSessions) {
    for (const session of data.savedSessions) {
      const { id: _id, ...rest } = session;
      await db.savedSessions.add(rest);
    }
  }
  if (data.settings) {
    await db.settings.save(data.settings);
  }
  if (data.profile) {
    await db.profile.save(data.profile);
  }
  if (data.notifications) {
    for (const notif of data.notifications) {
      const { id: _id, ...rest } = notif;
      await db.notifications.add(rest);
    }
  }
}
