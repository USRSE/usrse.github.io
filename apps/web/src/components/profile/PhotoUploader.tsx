import { useRef, useState } from "react";
import { useApi } from "@/lib/api";
import type { CurrentMember } from "@/hooks/useCurrentMember";

interface PhotoUploaderProps {
  currentPhotoUrl: string | null;
  initials: string;
  onChanged: (next: CurrentMember) => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; via: "file" | "url" | "delete" }
  | { kind: "error"; message: string };

interface ApiResponse {
  ok: boolean;
  user?: CurrentMember;
  error?: string;
  message?: string;
}

/**
 * Two-path photo control: pick a local file OR paste a URL.
 * Either path uploads through the worker, which validates byte
 * type, enforces a 5 MB cap, stores in R2, and replaces the
 * prior object atomically. Caller passes the refreshed member
 * back into IdentitySection's editor state via onChanged.
 */
export function PhotoUploader({
  currentPhotoUrl,
  initials,
  onChanged,
}: PhotoUploaderProps) {
  const apiFetch = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function postOrThrow(
    path: string,
    init: RequestInit,
    via: "file" | "url" | "delete"
  ) {
    setStatus({ kind: "uploading", via });
    try {
      const res = await apiFetch(path, init);
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || !json.ok || !json.user) {
        const message = json.message ?? json.error ?? `Failed (${res.status})`;
        setStatus({ kind: "error", message });
        return;
      }
      onChanged(json.user);
      setUrlValue("");
      setStatus({ kind: "idle" });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function handleFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    await postOrThrow(
      "/me/profile/photo",
      { method: "POST", body: form },
      "file"
    );
  }

  async function handleUrl() {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    await postOrThrow(
      "/me/profile/photo/from-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      },
      "url"
    );
  }

  async function handleDelete() {
    await postOrThrow(
      "/me/profile/photo",
      { method: "DELETE" },
      "delete"
    );
  }

  const isBusy = status.kind === "uploading";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-5">
        {/* Preview — same dossier vocabulary as Portrait but
            sized down for the editor context. */}
        <div
          className="w-20 h-20 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 grid place-items-center"
          aria-hidden="true"
        >
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-mono text-sm uppercase tracking-wider text-neutral-400">
              {initials}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* File picker — primary path. The hidden input is the
              actual <input type="file"> element; the visible
              button forwards click to it. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              // Reset so picking the same file twice fires onChange.
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 hover:border-purple-400 transition-colors text-sm text-neutral-700 hover:text-purple-700 disabled:opacity-50"
          >
            <span aria-hidden="true">↑</span>
            {status.kind === "uploading" && status.via === "file"
              ? "Uploading…"
              : currentPhotoUrl
                ? "Replace photo"
                : "Upload photo"}
          </button>

          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300">
            or
          </p>

          {/* URL path — fetched and re-hosted in R2 server-side
              so the URL is permanent even if the source rots. */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://… image url"
              disabled={isBusy}
              className="editorial-input flex-1 min-w-0 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleUrl}
              disabled={isBusy || !urlValue.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 hover:border-purple-400 transition-colors text-sm text-neutral-700 hover:text-purple-700 disabled:opacity-50 whitespace-nowrap"
            >
              {status.kind === "uploading" && status.via === "url"
                ? "Fetching…"
                : "Use URL"}
            </button>
          </div>

          {currentPhotoUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 hover:text-purple-700 transition-colors disabled:opacity-50"
            >
              {status.kind === "uploading" && status.via === "delete"
                ? "Removing…"
                : "↩ remove photo"}
            </button>
          )}
        </div>
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-rose-700 font-mono" role="alert">
          {status.message}
        </p>
      )}

      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
        max 5 MB · jpeg, png, or webp
      </p>
    </div>
  );
}
