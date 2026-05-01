import { z } from "zod";

export const UserTaxDetailsSchema = z.object({
  id: z.string(),
  type: z.string(), // "company" | "writer" | "other"
  name: z.string().nonempty({ message: "Įmonės pavadinimas yra privalomas" }),
  // imone
  adress: z.string().nonempty({ message: "Adresas yra privalomas" }),
  companyCode: z.string().nonempty({ message: "Įmonės kodas yra privalomas" }),
  city: z.string().nonempty({ message: "Miestas yra privalomas" }),
  postalCode: z.string().nonempty({ message: "Pašto kodas yra privalomas" }),
  country: z.string().nonempty({ message: "Šalis yra privaloma" }),
  VIT: z.string().optional(),
  // individualus
  licenseNumber: z.string(),
  created: z.number(),
  updated: z.number().optional(),
});

export type UserTaxDetails = z.infer<typeof UserTaxDetailsSchema>;

interface Permission {
  canCustomPrice: boolean,
  manageUsers: boolean,
  manageBilling: boolean,
  manageSettings: boolean,
}

interface PendingInvite {
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  invitedAt: string;
  existingUser?: boolean;
  tempUserId?: string;
}

interface CreditOperations {
  id: string,
  amount: number,
  reason: string, // e.g. "Task fee", "Service fee"
  invoiceId?: string, // optional invoice ID if applicable
  date: number,
}

export interface AgencyPrivate {
  id: string;
  name: string;
  credit: number;

  ownerId: string;
  members: Record<string, 'admin' | 'member'>;
  pendingInvites?: Record<string, PendingInvite>;

  creditDeductions: CreditOperations[]
  taxDetails?: UserTaxDetails,
  email: string,
  phone: string,

  permission: Permission,
  blocked: boolean,

  created: number,
  updated: number,
  lastLogin: number,
}
