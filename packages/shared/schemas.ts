import { z } from 'zod';

export const UserRoleSchema = z.enum(['CLIENT', 'DRIVER', 'DISPATCHER', 'ADMIN']);
