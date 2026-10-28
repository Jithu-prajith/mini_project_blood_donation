import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, Droplet, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDateTime } from '../utils/compatibility';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.isRead) return false;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency_escalation':
        return <AlertTriangle size={18} className="text-red-600" />;
      case 'request_match':
        return <Droplet size={18} className="text-red-500 fill-current" />;
      case 'shortage_alert':
        return <AlertTriangle size={18} className="text-amber-600" />;
      case 'expiry_warning':
        return <Clock size={18} className="text-purple-600" />;
      default:
        return <Bell size={18} className="text-blue-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 text-red-600">
              <Bell size={20} />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Notification Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time alerts for donor matches, emergency escalations, stock shortages, and expiry warnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={refreshNotifications}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl border transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 font-bold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl border transition-all ${
            filter === 'unread'
              ? 'bg-slate-900 text-white border-slate-900 font-bold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-900 text-sm">You are all caught up!</p>
            <p className="text-slate-500 mt-0.5">No notifications in this view.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n._id}
              onClick={() => markAsRead(n._id)}
              className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold text-slate-900 ${!n.isRead ? 'text-red-700' : ''}`}>
                      {n.title}
                    </h3>
                    {n.priority === 'high' && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-red-600 text-white font-bold uppercase tracking-wider">
                        High Priority
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-600 shrink-0">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 mt-2" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
