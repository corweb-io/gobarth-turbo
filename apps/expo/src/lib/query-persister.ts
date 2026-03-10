import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { storage } from "./storage"; // your MMKV instance

const mmkvClientStorage = {
  setItem: (key: string, value: string) => storage.set(key, value),
  getItem: (key: string) => storage.getString(key) ?? null,
  removeItem: (key: string) => storage.remove(key),
};

export const persister = createSyncStoragePersister({
  storage: mmkvClientStorage,
  key: "react-query-cache",
  throttleTime: 1000,
});
