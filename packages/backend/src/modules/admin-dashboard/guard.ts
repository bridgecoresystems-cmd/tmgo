// Только admin. Реализация — в общем lib/guard.
import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

export const requireAdmin = (request: Request) => requireRole(request, ROLES.ADMIN);
