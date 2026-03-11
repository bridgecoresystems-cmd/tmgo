export type UserRole = 'CLIENT' | 'DRIVER' | 'DISPATCHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}
