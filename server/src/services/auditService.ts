import { AuditLog } from '../models/AuditLog';
import { IUser } from '../models/User';

export const logAuditEvent = async (
  action: string,
  entityType: string,
  entityId?: string,
  user?: IUser,
  details?: Record<string, any>,
  ipAddress = '127.0.0.1'
): Promise<void> => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy: user?._id,
      performedByName: user?.name || 'System / Anonymous',
      performedByRole: user?.role || 'system',
      details,
      ipAddress,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err);
  }
};
