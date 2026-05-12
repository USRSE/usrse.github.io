interface OrgStatusTagProps {
  deletedAt?: string | null;
  mergedIntoId?: string | null;
  /** Vocab status — pending means the org was submitted by a member
   *  and is awaiting staff approval. */
  vocabStatus?: "pending" | "approved" | null;
}

/**
 * Compact status indicator that hangs off an org's title or list-row
 * name. Lifecycle states (deleted / merged) win over vocab status
 * because they're more consequential — a deleted org is not "pending"
 * in any useful sense.
 */
export function OrgStatusTag({
  deletedAt,
  mergedIntoId,
  vocabStatus,
}: OrgStatusTagProps) {
  if (deletedAt) {
    return (
      <span
        className="admin-classification"
        style={{
          color: "var(--color-danger-700)",
          textDecoration: "line-through",
        }}
      >
        Deleted
      </span>
    );
  }
  if (mergedIntoId) {
    return (
      <span
        className="admin-classification italic"
        style={{ color: "var(--admin-marginalia)" }}
      >
        Merged
      </span>
    );
  }
  if (vocabStatus === "pending") {
    return (
      <span
        className="admin-classification"
        style={{ color: "var(--admin-ribbon)" }}
      >
        Pending
      </span>
    );
  }
  return null;
}
