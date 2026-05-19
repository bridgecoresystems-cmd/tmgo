// Только client. Реализация — в общем lib/guard.
import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

export const requireClient = (request: Request) => requireRole(request, ROLES.CLIENT);
