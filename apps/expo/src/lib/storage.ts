import { createMMKV } from "react-native-mmkv";

export const storage = createMMKV({
  id: "my-app-storage",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
});

// Supabase-compatible storage adapter
export const mmkvStorageAdapter = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  getItem: (key: string) => {
    return storage.getString(key) ?? null;
  },
  removeItem: (key: string) => {
    storage.remove(key);
  },
};
