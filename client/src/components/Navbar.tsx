import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplet,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  Building2,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = async (role: UserRole) => {
    setShowDemoMenu(false);
    await demoLogin(role);
    if (role === 'donor') navigate('/donor-dashboard');
    else if (role === 'recipient') navigate('/recipient-dashboard');
    else if (role === 'blood_bank') navigate('/inventory');
    else if (role === 'admin') navigate('/admin');
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'System Admin', bg: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'blood_bank':
        return { label: 'Blood Bank Admin', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'recipient':
        return { label: 'Recipient / Hospital', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'donor':
      default:
        return { label: 'Blood Donor', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Droplet className="fill-current w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">HemaMatch</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">AI</span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium tracking-wide">Intelligent Blood Network</p>
          </div>
        </Link>

        {/* Global Action & Navigation Area */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher (For Evaluation & Demo Ease) */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
              title="Switch demo persona instantly"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Switch Demo Persona</span>
              <ChevronDown size={14} />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Test Any Persona (1-Click)
                </div>
                <button
                  onClick={() => handleRoleSwitch('donor')}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-red-50 flex items-center gap-2.5 text-slate-700 hover:text-red-700"
                >
                  <Droplet size={14} className="text-red-500" />
                  <div>
                    <p className="font-semibold">Blood Donor</p>
                    <p className="text-[10px] text-slate-600">Rahul Sharma (O+)</p>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSwitch('recipient')}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-blue-50 flex items-center gap-2.5 text-slate-700 hover:text-blue-700"
                >
                  <HeartHandshake size={14} className="text-blue-500" />
                  <div>
                    <p className="font-semibold">Recipient / Patient</p>
                    <p className="text-[10px] text-slate-600">Priya Sharma</p>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSwitch('blood_bank')}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-50 flex items-center gap-2.5 text-slate-700 hover:text-emerald-700"
                >
                  <Building2 size={14} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold">Blood Bank Admin</p>
                    <p className="text-[10px] text-slate-600">Apollo Central Blood Center</p>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSwitch('admin')}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-purple-50 flex items-center gap-2.5 text-slate-700 hover:text-purple-700"
                >
                  <ShieldAlert size={14} className="text-purple-500" />
                  <div>
                    <p className="font-semibold">System Administrator</p>
                    <p className="text-[10px] text-slate-600">Dr. Sarah Mitchell</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {user ? (
            <>
              {/* Active Role Pill */}
              <div className="hidden md:flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-600">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markAsRead(n._id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              !n.isRead ? 'bg-red-50/40 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between text-slate-900">
                              <span className="font-semibold line-clamp-1">{n.title}</span>
                              <span className="text-[10px] text-slate-600 shrink-0">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-semibold text-slate-700 hover:text-red-600"
                      >
                        View all notifications &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold hidden lg:inline-block max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown size={14} className="text-slate-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-600 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserIcon size={14} /> Profile & Settings
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
