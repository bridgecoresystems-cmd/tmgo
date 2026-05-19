// Унифицированный профиль доступен client / driver / admin.
import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

export const requireProfileUser = (request: Request) =>
  requireRole(request, ROLES.CLIENT, ROLES.DRIVER, ROLES.ADMIN);
