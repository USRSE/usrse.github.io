import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@us-rse/auth-shell";
import type { FormSchema } from "../../lib/formSchema";

interface FormDetail {
  ok: true;
  form: {
    id: string;
    title: string;
    slug: string;
    schema: FormSchema;
  };
}

interface SubmissionRow {
  id: string;
  formRevision: number;
  submitterUserId: string | null;
  payload: Record<string, unknown> | null;
  submittedAt: string;
}

interface SubmissionsResponse {
  ok: true;
  rows: SubmissionRow[];
}

export function FormSubmissionsPage() {
  const apiFetch = useApi();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<FormDetail["form"] | null>(null);
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [detailRes, listRes] = await Promise.all([
        apiFetch(`/admin/forms/${id}`),
        apiFetch(`/admin/forms/${id}/submissions`),
      ]);
      if (!detailRes.ok) {
        setError(`/admin/forms/${id} responded ${detailRes.status}`);
        return;
      }
      if (!listRes.ok) {
        setError(`/admin/forms/${id}/submissions responded ${listRes.status}`);
        return;
      }
      const detail = (await detailRes.json()) as FormDetail;
      const list = (await listRes.json()) as SubmissionsResponse;
      setForm(detail.form);
      setRows(list.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apiFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadCsv() {
    if (!id || downloading) return;
    setDownloading(true);
    try {
      const res = await apiFetch(`/admin/forms/${id}/submissions?format=csv`);
      if (!res.ok) {
        setError(`CSV download responded ${res.status}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form-${id}-submissions.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  }

  if (error)
    return (
      <p
        className="admin-classification"
        style={{ color: "var(--color-danger-700)" }}
      >
        {error}
      </p>
    );
  if (!form || !rows) return <p className="admin-marginalia">Loading…</p>;

  const fields = form.schema?.fields ?? [];

  return (
    <div className="admin-animate-reveal">
      <p className="admin-classification mb-6">
        US-RSE · Admin · Forms · {form.title} · Submissions
      </p>
      <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
        <h2
          className="admin-display"
          style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3rem)" }}
        >
          Submissions
        </h2>
        <button
          type="button"
          disabled={downloading || rows.length === 0}
          onClick={downloadCsv}
          className="inline-flex items-center px-6 py-3 rounded-md bg-purple-500 text-white font-semibold text-sm shadow-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {downloading ? "Preparing…" : "Download CSV"}
        </button>
      </div>
      <div className="flex items-center gap-4 mb-10 flex-wrap">
        <span className="admin-classification">{form.title}</span>
        <span className="admin-classification">{rows.length} responses</span>
      </div>

      {rows.length === 0 ? (
        <p className="admin-marginalia">No submissions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm border-collapse"
            style={{ borderTop: "1px solid var(--admin-rule)" }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-rule)" }}>
                <th
                  className="text-left py-3 pr-4 admin-classification"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Submitted at
                </th>
                <th
                  className="text-left py-3 pr-4 admin-classification"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Submitter
                </th>
                {fields.map((f) => (
                  <th
                    key={f.id}
                    className="text-left py-3 pr-4 admin-classification"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const payload = (r.payload ?? {}) as Record<string, unknown>;
                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid var(--admin-rule)" }}
                  >
                    <td className="py-3 pr-4 tabular-nums" style={{ whiteSpace: "nowrap" }}>
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {r.submitterUserId ?? (
                        <span className="admin-marginalia">Anonymous</span>
                      )}
                    </td>
                    {fields.map((f) => (
                      <td key={f.id} className="py-3 pr-4 align-top">
                        {formatCell(payload[f.id])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-12 admin-marginalia">
        <Link to={`/admin/forms/${id}`}>← Back to form</Link>
      </p>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
