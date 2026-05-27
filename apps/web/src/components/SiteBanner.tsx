import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";

interface Banner {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
}

const DISMISS_KEY_PREFIX = "dismissed_banner_";

export function SiteBanner() {
  const apiFetch = useApi();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/announcements/active-banner");
        if (cancelled || !res.ok) return;
        const body = (await res.json()) as { banner: Banner | null };
        if (cancelled) return;
        if (!body.banner) {
          setBanner(null);
          return;
        }
        // Check localStorage for prior dismissal
        try {
          if (window.localStorage.getItem(DISMISS_KEY_PREFIX + body.banner.id)) {
            setDismissed(true);
          }
        } catch {
          /* localStorage may be disabled; show banner anyway */
        }
        setBanner(body.banner);
      } catch {
        /* swallow — banner is a nice-to-have */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  function onDismiss() {
    if (!banner) return;
    try {
      window.localStorage.setItem(DISMISS_KEY_PREFIX + banner.id, "1");
    } catch {
      /* localStorage may be disabled */
    }
    setDismissed(true);
  }

  if (!banner || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-purple-700 text-white"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {banner.title}
          </p>
          <p className="text-sm text-purple-100 line-clamp-1">{banner.body}</p>
        </div>
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            className="text-sm underline hover:text-white font-semibold whitespace-nowrap"
          >
            Learn more →
          </a>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="text-purple-100 hover:text-white p-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
