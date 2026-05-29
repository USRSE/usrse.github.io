import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "@/lib/api";
import { FormRenderer, type FormSchema } from "@/components/FormRenderer";

interface PublicForm {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  schema: FormSchema;
  revision: number;
  acceptsSubmissions: boolean;
}

export function FormPage() {
  const { slug } = useParams<{ slug: string }>();
  const apiFetch = useApi();
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setForm(null);

    void (async () => {
      try {
        const res = await apiFetch(`/forms/${slug}`);
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(`/forms/${slug} responded ${res.status}`);
          setLoading(false);
          return;
        }
        const body = (await res.json()) as { ok: true; form: PublicForm };
        setForm(body.form);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, apiFetch]);

  if (loading) {
    return (
      <FormShell title="Loading…">
        <div className="animate-pulse space-y-6" aria-hidden="true">
          <div className="h-3 w-32 bg-neutral-100 rounded" />
          <div className="h-10 w-3/4 bg-neutral-100 rounded" />
          <div className="h-4 w-1/2 bg-neutral-100 rounded" />
          <div className="h-40 w-full bg-neutral-100 rounded mt-8" />
        </div>
      </FormShell>
    );
  }

  if (notFound) {
    return (
      <FormShell title="Form not found">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          404 · not published
        </p>
        <p className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight leading-tight mb-6 max-w-2xl">
          This form may have been closed, unpublished, or never existed at
          this address.
        </p>
        <Link
          to="/"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-purple-600 hover:text-purple-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to home
        </Link>
      </FormShell>
    );
  }

  if (error || !form) {
    return (
      <FormShell title="Form">
        <p className="font-mono text-sm text-neutral-500 py-6 px-6 border border-neutral-200 bg-neutral-50 rounded-lg">
          {error ?? "This form is temporarily unavailable."}
        </p>
      </FormShell>
    );
  }

  return (
    <FormShell title={form.title}>
      <section className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-purple-600 mb-6">
          Community form
        </p>
        <h1 className="font-display text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.05] mb-6 text-balance">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl">
            {form.description}
          </p>
        )}
      </section>

      {form.acceptsSubmissions ? (
        <FormRenderer schema={form.schema} slug={form.slug} />
      ) : (
        <div
          role="status"
          className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 lg:p-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-4">
            Submissions closed
          </p>
          <p className="font-display text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
            This form is no longer accepting submissions.
          </p>
        </div>
      )}
    </FormShell>
  );
}

interface FormShellProps {
  title: string;
  children: React.ReactNode;
}

function FormShell({ title, children }: FormShellProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — neutral dark, lets the form itself carry the brand color */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-purple-950 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li className="text-white/30">/</li>
              <li>
                <span className="text-white/50">Forms</span>
              </li>
              <li className="text-white/30">/</li>
              <li>
                <span className="text-white/90 font-medium">{title}</span>
              </li>
            </ol>
          </nav>
          <h1
            className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <article className="max-w-3xl">{children}</article>
      </div>
    </div>
  );
}
