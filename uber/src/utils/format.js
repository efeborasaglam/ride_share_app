const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const pad = (n) => String(n).padStart(2, "0");

export function formatDateTime(input) {
  const d = input instanceof Date ? input : new Date(input);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(seconds) {
  const min = Math.round(seconds / 60);
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${min % 60} min` : `${min} min`;
}

export const STATUS_COLORS = {
  PENDING: "#ef6c00",
  ACCEPTED: "#2e7d32",
  DECLINED: "#c62828",
  CANCELLED: "#757575",
  CANCELLED_BY_DRIVER: "#757575",
  ACTIVE: "#2e7d32",
};

const STATUS_LABELS = {
  PENDING: "Waiting",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  CANCELLED_BY_DRIVER: "Trip cancelled",
  ACTIVE: "Active",
};

export function formatTime(input) {
  const d = input instanceof Date ? input : new Date(input);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const statusLabel = (status) => STATUS_LABELS[status] ?? status;
