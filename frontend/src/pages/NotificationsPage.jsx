import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { Bell, Check, CheckCheck, Trash2, Mail, MailOpen } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-3 border-must-gold/30 border-t-must-gold rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-must-gold" /> Notifications
            </h1>
            <p className="text-gray-400 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="must-button-ghost flex items-center gap-2 text-sm">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div
              key={n.NotificationID}
              className={`glass-card p-4 flex items-start gap-4 animate-fade-in-up transition-all hover:border-must-gold/20 cursor-pointer ${!n.IsRead ? 'border-must-gold/10 bg-must-gold/3' : ''}`}
              style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
              onClick={() => !n.IsRead && markAsRead(n.NotificationID)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.IsRead ? 'bg-must-gold/10' : 'bg-white/5'}`}>
                {n.IsRead ? (
                  <MailOpen className="w-5 h-5 text-gray-500" />
                ) : (
                  <Mail className="w-5 h-5 text-must-gold" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${!n.IsRead ? 'text-white' : 'text-gray-400'}`}>{n.Title}</p>
                  {!n.IsRead && <span className="w-2 h-2 bg-must-gold rounded-full flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-400 mt-1">{n.Message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(n.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.IsRead && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAsRead(n.NotificationID); }}
                  className="text-gray-500 hover:text-must-gold transition-colors flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
