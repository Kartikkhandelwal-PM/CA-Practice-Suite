import React, { useState } from 'react';
import { Search, Bell, Settings, X, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

export function Topbar() {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const toast = useToast();

  const notifications = [
    { id: 1, text: 'GSTR-3B filing due for Agarwal Exports tomorrow', time: '2 hours ago', unread: true },
    { id: 2, text: 'New document uploaded by TechVision Pvt Ltd', time: '5 hours ago', unread: true },
    { id: 3, text: 'Task "Audit Report" marked as completed', time: '1 day ago', unread: false },
  ];

  return (
    <div className="h-[56px] bg-white border-b border-gray-200 flex items-center gap-3 px-5 shrink-0 z-50 relative">
      <div className="font-serif text-[17px] font-semibold flex-1 text-gray-900">
        {/* Title could be dynamic based on route, but keeping it simple for now */}
      </div>
      
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-[220px] focus-within:w-[280px] focus-within:border-blue-600 focus-within:bg-white transition-all duration-200">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input 
          placeholder="Search..." 
          className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-2 relative">
        <button 
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={18} />
          <div className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-red-600 border-[1.5px] border-white" />
        </button>
        
        {showNotifications && (
          <div className="absolute top-[44px] right-10 w-[320px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-slide-down">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-[13px] text-gray-900">Notifications</span>
              <button className="text-[11px] text-blue-600 hover:underline font-medium" onClick={() => { setShowNotifications(false); toast('All marked as read'); }}>Mark all as read</button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-blue-600' : 'bg-transparent'}`} />
                    <div>
                      <p className={`text-[12.5px] leading-snug ${n.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{n.text}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          onClick={() => setShowSettings(true)}
        >
          <Settings size={18} />
        </button>
      </div>

      {showSettings && (
        <Modal
          title="Settings"
          onClose={() => setShowSettings(false)}
          size="md"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setShowSettings(false); toast('Settings saved', 'success'); }}>Save Changes</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Theme</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white">
                <option>Light</option>
                <option>Dark</option>
                <option>System Default</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Email Notifications</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="email-notif" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <label htmlFor="email-notif" className="text-[13px] text-gray-700">Receive daily digest</label>
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Default View</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white">
                <option>Dashboard</option>
                <option>Kanban Board</option>
                <option>Tasks List</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
