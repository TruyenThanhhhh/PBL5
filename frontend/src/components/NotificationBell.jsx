import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Chuông thông báo — trên Community mở dashboard nơi có panel thông báo đầy đủ */
export default function NotificationBell() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      aria-label="Thông báo"
      title="Thông báo"
      onClick={() => window.dispatchEvent(new CustomEvent('openNotifications'))}
    >
      <Bell size={22} strokeWidth={2} />
    </button>
  );
}
