interface StatusTagProps {
  deletedAt?: string | null;
  mergedIntoUserId?: string | null;
  isLegacyImport?: boolean;
}

export function StatusTag({ deletedAt, mergedIntoUserId, isLegacyImport }: StatusTagProps) {
  if (deletedAt) {
    return (
      <span className="admin-classification" style={{ color: "var(--color-danger-700)", textDecoration: "line-through" }}>
        Deleted
      </span>
    );
  }
  if (mergedIntoUserId) {
    return (
      <span className="admin-classification italic" style={{ color: "var(--admin-marginalia)" }}>
        Merged
      </span>
    );
  }
  if (isLegacyImport) {
    return (
      <span className="admin-classification italic" style={{ color: "var(--admin-marginalia)" }}>
        Legacy
      </span>
    );
  }
  return null;
}
