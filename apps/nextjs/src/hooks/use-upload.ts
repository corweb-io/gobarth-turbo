"use client";
import { createBrowserClient } from "@my-app/auth/client";
import { useState } from "react";

export function useUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const upload = async (file: File, path: string): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
