import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

// Только админ. Возвращает админа — нужен в approve-эндпоинте (resolvedById).
export const requireAdmin = (request: Request) => requireRole(request, ROLES.ADMIN);
