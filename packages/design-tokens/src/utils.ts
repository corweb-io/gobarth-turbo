/** Extract initials from a name string */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/** Format a badge count with a max (e.g., "99+") */
export function formatBadgeCount(count: number, max = 99): string {
  if (count <= 0) return "";
  if (count > max) return `${max}+`;
  return String(count);
}

/** Map a status string to a semantic color key */
export function getStatusColor(
  status: string,
): "success" | "warning" | "error" | "info" {
  switch (status) {
    case "active":
    case "completed":
    case "online":
      return "success";
    case "pending":
    case "processing":
      return "warning";
    case "failed":
    case "error":
    case "offline":
      return "error";
    default:
      return "info";
  }
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
