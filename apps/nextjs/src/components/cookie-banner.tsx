"use client";
import { getCookie, setCookie } from "cookies-next";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    setCookie("cookie-consent", "accepted", { maxAge: 60 * 60 * 24 * 365 });
    posthog.opt_in_capturing();
    setVisible(false);
  };

  const decline = () => {
    setCookie("cookie-consent", "declined", { maxAge: 60 * 60 * 24 * 365 });
    posthog.opt_out_capturing();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-600">
        We use cookies for analytics to improve your experience.{" "}
        <a href="/privacy" className="underline">
          Privacy policy
        </a>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={decline}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
