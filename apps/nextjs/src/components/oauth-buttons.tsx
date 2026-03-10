"use client";
import Image from "next/image";
import { signInWithOAuth } from "../lib/auth";

export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signInWithOAuth("google")}
        className="flex items-center justify-center gap-3 px-4 py-2 border rounded-md hover:bg-gray-50"
      >
        <Image
          src="/icons/google.svg"
          alt=""
          width={20}
          height={20}
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => signInWithOAuth("apple")}
        className="flex items-center justify-center gap-3 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
      >
        <Image
          src="/icons/apple.svg"
          alt=""
          width={20}
          height={20}
          className="w-5 h-5"
        />
        Continue with Apple
      </button>

      <button
        type="button"
        onClick={() => signInWithOAuth("github")}
        className="flex items-center justify-center gap-3 px-4 py-2 border rounded-md hover:bg-gray-50"
      >
        <Image
          src="/icons/github.svg"
          alt=""
          width={20}
          height={20}
          className="w-5 h-5"
        />
        Continue with GitHub
      </button>
    </div>
  );
}
