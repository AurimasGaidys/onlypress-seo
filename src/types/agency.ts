export interface Agency { 
  id: string; 
  name: string; 
  theme?: string; 
  isPersonal: boolean;

  created: number,
  updated: number,
  lastLogin: number,
}
