// src/types/user.ts
export interface UserPublic {
  id: string;
  displayName: string;
  email: string;
  agencies: Record<string, 'admin' | 'member'>;
}

export interface PendingInvite {
  role: 'admin' | 'member';
  name: string;
  agencyId: string
  existingUser: boolean
  invitedAt: number
  invitedBy: string
}

export interface UserPrivate {
  id: string;
  email: string;
  credit: number;
  menuVersion?: 'menu1' | 'menu2'; // Editor menu tabs version preference
  pendingInvites: PendingInvite[];
  // Add other private fields here in the future if needed
}
