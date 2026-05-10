import { useAuth } from "@workos-inc/authkit-react";

/** Shown when the actor signed in but has no admin-shaped position. */
export function NotEntitled() {
  const { signOut } = useAuth();
  return (
    <main
      style={{
        maxWidth: "32rem",
        margin: "6rem auto",
        padding: "2rem",
        border: "1px solid #eaeced",
        borderRadius: "0.75rem",
        fontFamily: "system-ui",
        color: "#363c3e",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginTop: 0, color: "#741755" }}>
        You don't have access to the admin app.
      </h1>
      <p>
        This space is for US-RSE staff, board members, group leads, and event
        committee chairs. If you should be here, contact a super admin.
      </p>
      <button
        type="button"
        onClick={() => signOut()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          border: "1px solid #d8d4e5",
          background: "white",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </main>
  );
}
