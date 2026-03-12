import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  LayoutTemplate, 
  StickyNote, 
  KeyRound, 
  FolderOpen, 
  CalendarDays,
  Users,
  FileText,
  Mail,
  Settings
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Sidebar() {
  const { users } = useApp();
  const currentUser = users[0]; // Assuming first user is logged in

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'inbox', label: 'Inbox', icon: Mail, path: '/inbox' },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare, path: '/kanban' },
    { id: 'tasks', label: 'All Tasks', icon: ListTodo, path: '/tasks' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, path: '/templates' },
    { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, path: '/documents' },
    { id: 'meetings', label: 'Meetings', icon: CalendarDays, path: '/meetings' },
    { id: 'notes', label: 'Sticky Notes', icon: StickyNote, path: '/notes' },
    { id: 'passwords', label: 'Passwords', icon: KeyRound, path: '/passwords' },
    { id: 'compliance', label: 'Compliance', icon: FileText, path: '/compliance' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-[248px] shrink-0 bg-[#0d1117] flex flex-col h-screen transition-all relative z-[100] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 h-[56px] border-b border-white/10 shrink-0">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold">
          K
        </div>
        <div>
          <div className="font-serif text-[15px] font-semibold text-white tracking-tight">KDK Practice</div>
          <div className="text-[9px] text-white/35 tracking-widest uppercase">Suite</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-4 pt-2 pb-1">Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-[13px] font-medium transition-colors relative ${
                isActive ? 'bg-blue-600/25 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/85'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-blue-600 rounded-r-sm" />}
                <item.icon size={16} className={isActive ? 'opacity-100' : 'opacity-80'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUser.name.split(' ').map(w => w[0]).join('')}
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-white/40 truncate">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
