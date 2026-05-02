import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("RootErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || String(this.state.error);
    const stack = this.state.error.stack;

    return (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          maxWidth: "48rem",
          margin: "4rem auto",
          padding: "2rem",
          border: "1px solid #eaeced",
          borderRadius: "0.75rem",
          color: "#363c3e",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            marginTop: 0,
            color: "#741755",
          }}
        >
          Something broke before the app could render
        </h1>
        <p style={{ fontSize: "0.95rem" }}>
          <strong>{this.state.error.name}:</strong> {message}
        </p>
        {stack && (
          <pre
            style={{
              fontSize: "0.75rem",
              color: "#6b7476",
              background: "#f5f7f8",
              padding: "1rem",
              borderRadius: "0.5rem",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {stack}
          </pre>
        )}
        <p style={{ fontSize: "0.875rem", color: "#6b7476", marginTop: "1rem" }}>
          The full stack trace is also logged to the browser console.
        </p>
      </div>
    );
  }
}
