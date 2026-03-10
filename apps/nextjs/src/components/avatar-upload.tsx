"use client";
import Image from "next/image";
import { useRef } from "react";
import { useUpload } from "../hooks/use-upload";
import { trpc } from "../lib/trpc";

type Props = {
  userId: string;
  currentUrl: string | null;
};

export function AvatarUpload({ userId, currentUrl }: Props) {
  const { upload, uploading } = useUpload("avatars");
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const updateAvatar = trpc.user.updateAvatar.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
    },
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const path = `${userId}/avatar.${file.name.split(".").pop()}`;
    const url = await upload(file, path);
    if (url) {
      updateAvatar.mutate({ avatarUrl: url });
    }
  };

  const isLoading = uploading || updateAvatar.isPending;

  return (
    <div className="flex flex-col items-center gap-3">
      {currentUrl && (
        <Image
          src={currentUrl}
          alt="Avatar"
          width={80}
          height={80}
          className="w-20 h-20 rounded-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Uploading..." : "Change avatar"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
