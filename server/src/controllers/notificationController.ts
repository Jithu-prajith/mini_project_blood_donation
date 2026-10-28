import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const notifications = await Notification.find({ recipientUserId: userId })
      .sort({ createdAt: -1 })
      .limit(40);

    const unreadCount = await Notification.countDocuments({ recipientUserId: userId, isRead: false });

    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipientUserId: req.user!._id },
      { isRead: true }
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    await Notification.updateMany({ recipientUserId: userId, isRead: false }, { isRead: true });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
