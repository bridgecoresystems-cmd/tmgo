import { requireRole } from '../../lib/guard';
import { ROLES } from '../../constants/roles';

export { requireDriverWithProfile as requireDriverProfile } from '../../lib/guard';

export const requireAdmin = (request: Request) => requireRole(request, ROLES.ADMIN);
