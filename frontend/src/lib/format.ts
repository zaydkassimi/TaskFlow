const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function fullName(
  user: { firstName: string; lastName: string } | null | undefined,
): string {
  if (!user) {
    return "Unassigned";
  }
  return `${user.firstName} ${user.lastName}`.trim();
}

export function initials(
  user: { firstName: string; lastName: string } | null | undefined,
): string {
  if (!user) {
    return "?";
  }
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const then = new Date(value).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);
  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });
  let duration = seconds;
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) {
      return formatter.format(-Math.round(duration), unit);
    }
    duration /= amount;
  }
  return "";
}

export function isOverdue(
  dueDate: string | null | undefined,
  status: string,
): boolean {
  if (!dueDate || status === "DONE") {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = DATE_ONLY.test(dueDate)
    ? new Date(
        Number(dueDate.slice(0, 4)),
        Number(dueDate.slice(5, 7)) - 1,
        Number(dueDate.slice(8, 10)),
      )
    : new Date(dueDate);
  return due.getTime() < today.getTime();
}
