export function RoleTag({ role }: { role: "member" | "staff" | "super_admin" | "admin" }) {
  if (role === "super_admin") {
    return (
      <span className="admin-classification" style={{ color: "var(--admin-ribbon)" }}>
        Super admin
      </span>
    );
  }
  if (role === "staff" || role === "admin") {
    return (
      <span className="admin-classification" style={{ color: "var(--admin-mark)" }}>
        Staff
      </span>
    );
  }
  return <span className="admin-classification">Member</span>;
}
