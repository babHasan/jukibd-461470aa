export type RepairStatus = "received" | "diagnosing" | "in-progress" | "completed" | "picked-up";

export interface RepairOrder {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  deviceBrand: string;
  issue: string;
  status: RepairStatus;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

export const statusLabels: Record<RepairStatus, string> = {
  received: "Received",
  diagnosing: "Diagnosing",
  "in-progress": "In Progress",
  completed: "Completed",
  "picked-up": "Picked Up",
};

export const statusFlow: RepairStatus[] = [
  "received",
  "diagnosing",
  "in-progress",
  "completed",
  "picked-up",
];

let nextId = 8;
export function generateTicket() {
  return `RPR-${String(nextId++).padStart(4, "0")}`;
}

export const sampleOrders: RepairOrder[] = [
  {
    id: "1",
    ticketNumber: "RPR-0001",
    customerName: "Marcus Johnson",
    customerPhone: "(555) 234-5678",
    deviceType: "Smartphone",
    deviceBrand: "Apple iPhone 15",
    issue: "Cracked screen replacement",
    status: "in-progress",
    estimatedCost: 189,
    createdAt: "2026-03-20T09:00:00",
    updatedAt: "2026-03-21T14:30:00",
  },
  {
    id: "2",
    ticketNumber: "RPR-0002",
    customerName: "Sarah Chen",
    customerPhone: "(555) 876-1234",
    deviceType: "Laptop",
    deviceBrand: "Dell XPS 15",
    issue: "Battery not charging, keyboard intermittent",
    status: "diagnosing",
    estimatedCost: 250,
    createdAt: "2026-03-21T10:15:00",
    updatedAt: "2026-03-21T10:15:00",
  },
  {
    id: "3",
    ticketNumber: "RPR-0003",
    customerName: "David Park",
    customerPhone: "(555) 345-9012",
    deviceType: "Tablet",
    deviceBrand: "iPad Air",
    issue: "Water damage recovery",
    status: "received",
    estimatedCost: 320,
    createdAt: "2026-03-22T08:00:00",
    updatedAt: "2026-03-22T08:00:00",
  },
  {
    id: "4",
    ticketNumber: "RPR-0004",
    customerName: "Emily Rodriguez",
    customerPhone: "(555) 567-3456",
    deviceType: "Smartphone",
    deviceBrand: "Samsung Galaxy S24",
    issue: "Back camera not focusing",
    status: "completed",
    estimatedCost: 145,
    createdAt: "2026-03-19T11:30:00",
    updatedAt: "2026-03-22T09:00:00",
  },
  {
    id: "5",
    ticketNumber: "RPR-0005",
    customerName: "James Wilson",
    customerPhone: "(555) 678-4567",
    deviceType: "Laptop",
    deviceBrand: "MacBook Pro 14",
    issue: "SSD upgrade to 1TB",
    status: "picked-up",
    estimatedCost: 380,
    createdAt: "2026-03-17T14:00:00",
    updatedAt: "2026-03-21T16:00:00",
  },
  {
    id: "6",
    ticketNumber: "RPR-0006",
    customerName: "Lisa Thompson",
    customerPhone: "(555) 789-0123",
    deviceType: "Smartwatch",
    deviceBrand: "Apple Watch Ultra",
    issue: "Screen unresponsive after drop",
    status: "in-progress",
    estimatedCost: 210,
    createdAt: "2026-03-20T15:45:00",
    updatedAt: "2026-03-22T10:00:00",
  },
  {
    id: "7",
    ticketNumber: "RPR-0007",
    customerName: "Robert Kim",
    customerPhone: "(555) 012-6789",
    deviceType: "Gaming Console",
    deviceBrand: "PlayStation 5",
    issue: "Overheating and shutting down",
    status: "received",
    estimatedCost: 175,
    createdAt: "2026-03-22T07:30:00",
    updatedAt: "2026-03-22T07:30:00",
  },
];
