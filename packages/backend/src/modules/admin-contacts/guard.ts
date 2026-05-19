// Только админ.
import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

export const requireAdmin = (request: Request) => requireRole(request, ROLES.ADMIN);
