export type RepairStatus = "received" | "diagnosing" | "in-progress" | "completed" | "picked-up";

export interface RepairNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface RepairPart {
  id: string;
  name: string;
  cost: number;
  quantity: number;
}

export interface RepairOrder {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceType: string;
  deviceBrand: string;
  issue: string;
  status: RepairStatus;
  estimatedCost: number;
  notes: RepairNote[];
  parts: RepairPart[];
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
    customerEmail: "marcus.j@email.com",
    deviceType: "Smartphone",
    deviceBrand: "Apple iPhone 15",
    issue: "Cracked screen replacement",
    status: "in-progress",
    estimatedCost: 189,
    notes: [
      { id: "n1", text: "Customer dropped phone on concrete. Screen shattered but touch still works partially.", createdAt: "2026-03-20T09:15:00" },
      { id: "n2", text: "OEM replacement screen ordered. ETA 1 day.", createdAt: "2026-03-21T14:30:00" },
    ],
    parts: [
      { id: "p1", name: "iPhone 15 OLED Screen", cost: 89, quantity: 1 },
    ],
    createdAt: "2026-03-20T09:00:00",
    updatedAt: "2026-03-21T14:30:00",
  },
  {
    id: "2",
    ticketNumber: "RPR-0002",
    customerName: "Sarah Chen",
    customerPhone: "(555) 876-1234",
    customerEmail: "sarah.chen@email.com",
    deviceType: "Laptop",
    deviceBrand: "Dell XPS 15",
    issue: "Battery not charging, keyboard intermittent",
    status: "diagnosing",
    estimatedCost: 250,
    notes: [
      { id: "n3", text: "Running full diagnostics. Battery health at 42%. Keyboard ribbon cable may be loose.", createdAt: "2026-03-21T11:00:00" },
    ],
    parts: [],
    createdAt: "2026-03-21T10:15:00",
    updatedAt: "2026-03-21T10:15:00",
  },
  {
    id: "3",
    ticketNumber: "RPR-0003",
    customerName: "David Park",
    customerPhone: "(555) 345-9012",
    customerEmail: "d.park@email.com",
    deviceType: "Tablet",
    deviceBrand: "iPad Air",
    issue: "Water damage recovery",
    status: "received",
    estimatedCost: 320,
    notes: [],
    parts: [],
    createdAt: "2026-03-22T08:00:00",
    updatedAt: "2026-03-22T08:00:00",
  },
  {
    id: "4",
    ticketNumber: "RPR-0004",
    customerName: "Emily Rodriguez",
    customerPhone: "(555) 567-3456",
    customerEmail: "emily.r@email.com",
    deviceType: "Smartphone",
    deviceBrand: "Samsung Galaxy S24",
    issue: "Back camera not focusing",
    status: "completed",
    estimatedCost: 145,
    notes: [
      { id: "n4", text: "Camera module replaced. All tests passed.", createdAt: "2026-03-22T09:00:00" },
    ],
    parts: [
      { id: "p2", name: "Galaxy S24 Camera Module", cost: 65, quantity: 1 },
    ],
    createdAt: "2026-03-19T11:30:00",
    updatedAt: "2026-03-22T09:00:00",
  },
  {
    id: "5",
    ticketNumber: "RPR-0005",
    customerName: "James Wilson",
    customerPhone: "(555) 678-4567",
    customerEmail: "jwilson@email.com",
    deviceType: "Laptop",
    deviceBrand: "MacBook Pro 14",
    issue: "SSD upgrade to 1TB",
    status: "picked-up",
    estimatedCost: 380,
    notes: [
      { id: "n5", text: "SSD cloned and upgraded successfully. macOS restored.", createdAt: "2026-03-21T15:00:00" },
    ],
    parts: [
      { id: "p3", name: "Samsung 990 Pro 1TB NVMe", cost: 120, quantity: 1 },
    ],
    createdAt: "2026-03-17T14:00:00",
    updatedAt: "2026-03-21T16:00:00",
  },
  {
    id: "6",
    ticketNumber: "RPR-0006",
    customerName: "Lisa Thompson",
    customerPhone: "(555) 789-0123",
    customerEmail: "lisa.t@email.com",
    deviceType: "Smartwatch",
    deviceBrand: "Apple Watch Ultra",
    issue: "Screen unresponsive after drop",
    status: "in-progress",
    estimatedCost: 210,
    notes: [],
    parts: [],
    createdAt: "2026-03-20T15:45:00",
    updatedAt: "2026-03-22T10:00:00",
  },
  {
    id: "7",
    ticketNumber: "RPR-0007",
    customerName: "Robert Kim",
    customerPhone: "(555) 012-6789",
    customerEmail: "r.kim@email.com",
    deviceType: "Gaming Console",
    deviceBrand: "PlayStation 5",
    issue: "Overheating and shutting down",
    status: "received",
    estimatedCost: 175,
    notes: [],
    parts: [],
    createdAt: "2026-03-22T07:30:00",
    updatedAt: "2026-03-22T07:30:00",
  },
];
