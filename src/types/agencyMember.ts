export interface AgencyMember { 
  uid: string; 
  email: string; 
  displayName: string;
  role: 'admin' | 'member'; 
}