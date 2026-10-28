import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';
import { BloodRequest, IBloodRequest } from '../models/BloodRequest';
import { BloodBank } from '../models/BloodBank';

export const sendNotification = async (
  recipientUserId: string,
  title: string,
  message: string,
  type: INotification['type'],
  referenceId?: string,
  referenceType?: INotification['referenceType'],
  priority: INotification['priority'] = 'normal'
): Promise<INotification> => {
  return await Notification.create({
    recipientUserId,
    title,
    message,
    type,
    referenceId,
    referenceType,
    priority,
    isRead: false
  });
};

/**
 * Dispatches alerts to matched donors for a blood request
 */
export const notifyMatchedDonors = async (
  request: IBloodRequest,
  donorUserIds: string[]
): Promise<number> => {
  let count = 0;
  const isEmergency = request.urgencyLevel === 'emergency';
  const priority = isEmergency ? 'high' : 'normal';

  for (const donorId of donorUserIds) {
    await sendNotification(
      donorId,
      isEmergency
        ? `EMERGENCY BLOOD ALERT: ${request.bloodGroup} needed immediately!`
        : `Blood Request Match: ${request.bloodGroup} ${request.component}`,
      `Patient at ${request.hospitalName} requires ${request.unitsNeeded} unit(s) of ${request.bloodGroup} ${request.component}. Urgency: ${request.urgencyLevel.toUpperCase()}. Your profile was identified as an eligible match.`,
      isEmergency ? 'emergency_escalation' : 'request_match',
      request._id.toString(),
      'request',
      priority
    );
    count++;
  }

  return count;
};

/**
 * Dispatches emergency escalation to all blood bank admins
 */
export const broadcastEmergencyEscalation = async (
  request: IBloodRequest
): Promise<number> => {
  const bankAdmins = await User.find({ role: 'blood_bank' });
  let notified = 0;

  for (const admin of bankAdmins) {
    await sendNotification(
      admin._id.toString(),
      `CRITICAL ESCALATION: Unfulfilled ${request.urgencyLevel.toUpperCase()} Blood Request`,
      `URGENT ASSISTANCE REQUIRED: Request for ${request.unitsNeeded} unit(s) of ${request.bloodGroup} ${request.component} at ${request.hospitalName} remains unfulfilled. Please review current stock and consider emergency transfer or direct allocation.`,
      'emergency_escalation',
      request._id.toString(),
      'request',
      'high'
    );
    notified++;
  }

  return notified;
};
