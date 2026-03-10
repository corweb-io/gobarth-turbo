import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = async (userId: string): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return null;

    const image = result.assets[0];
    if (!image?.uri) return null;

    setUploading(true);
    setError(null);

    try {
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ext = image.uri.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, decode(base64), {
          contentType: `image/${ext}`,
          upsert: true,
        });

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

  return { pickAndUpload, uploading, error };
}
