import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysLeft, pct } from '../utils';
import { AlertCircle, Zap, Clock, CheckCircle, Calendar as CalendarIcon, Users, ShieldAlert, GitMerge, Plus, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { TypeChip, StatusBadge } from '../components/ui/Badges';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { Task } from '../types';

export function DashboardPage() {
  const { tasks, setTasks, clients, users, deadlines, meetings } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  
  const markComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
  };
  const overdue = tasks.filter(t => t.status !== 'Completed' && (daysLeft(t.dueDate) ?? 0) < 0);
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const dueSoon = tasks.filter(t => t.status !== 'Completed' && (daysLeft(t.dueDate) ?? -1) >= 0 && (daysLeft(t.dueDate) ?? 8) <= 7).length;
  const urgent = deadlines.filter(d => (daysLeft(d.dueDate) ?? 8) <= 7 && (daysLeft(d.dueDate) ?? -1) >= 0);
  const upcomingMeetings = meetings.filter(m => (daysLeft(m.date) ?? -1) >= 0 && m.status !== 'completed').slice(0, 3);

  const stats = [
    { label: 'Overdue Tasks', num: overdue.length, sub: `${Math.abs(Math.min(...overdue.map(t => daysLeft(t.dueDate) || 0)) || 0)} days max`, color: '#dc2626', icon: AlertCircle },
    { label: 'In Progress', num: inProgress, sub: 'Active tasks', color: '#2563eb', icon: Zap },
    { label: 'Due This Week', num: dueSoon, sub: 'In the next 7 days', color: '#d97706', icon: Clock },
    { label: 'Completed', num: completed, sub: `of ${tasks.length} total tasks`, color: '#059669', icon: CheckCircle },
  ];

  return (
    <div className="h-full">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <h1 className="font-serif text-[22px] font-semibold text-gray-900">Good morning, Rajesh</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Here's what needs your attention today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors shadow-sm" onClick={openNewTask}>
          <Plus size={15} /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4.5 cursor-pointer hover:shadow-md hover:-translate-y-[1px] transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: s.color }} />
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-gray-500 font-medium">{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '18', color: s.color }}>
                <s.icon size={15} />
              </div>
            </div>
            <div className="font-serif text-[34px] font-semibold leading-none my-2" style={{ color: s.color }}>{s.num}</div>
            <div className="text-[11px] font-semibold mt-1.5 text-gray-400">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <AlertCircle size={15} className="text-red-600" />
            <h3 className="text-[14px] font-semibold flex-1">Overdue Tasks</h3>
            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[11px] font-bold">{overdue.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            {overdue.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>All tasks are on track!</p></div>}
            {overdue.slice(0, 5).map(t => {
              const c = clients.find(x => x.id === t.clientId);
              const a = users.find(x => x.id === t.assigneeId);
              return (
                <div key={t.id} className="flex items-center gap-2.5 px-4.5 py-2.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openEditTask(t)}>
                  <TypeChip type={t.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">#{t.id}</span>
                      <div className="font-medium text-[13px] truncate text-gray-900">{t.title}</div>
                      {t.subtasks && t.subtasks.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0" title={`${t.subtasks.filter(s => s.done).length}/${t.subtasks.length} subtasks done`}>
                          <GitMerge size={10} />
                          <span>{t.subtasks.filter(s => s.done).length}/{t.subtasks.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">{c?.name || '—'}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10.5px] font-bold px-1.5 py-0.5 rounded">
                    {Math.abs(daysLeft(t.dueDate) || 0)}d
                  </span>
                  <Avatar user={a} size={24} />
                  <button 
                    className="ml-2 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                    onClick={(e) => markComplete(t.id, e)}
                    title="Mark Complete"
                  >
                    <CheckCircle size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <CalendarIcon size={15} className="text-blue-600" />
            <h3 className="text-[14px] font-semibold flex-1">Upcoming Meetings</h3>
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[11px] font-bold">{upcomingMeetings.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[300px] p-2">
            {upcomingMeetings.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>No upcoming meetings.</p></div>}
            {upcomingMeetings.map(m => {
              const c = clients.find(x => x.id === m.clientId);
              const dl = daysLeft(m.date) || 0;
              return (
                <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-3.5 mb-2 hover:shadow-md transition-shadow border-l-[3px]" style={{ borderLeftColor: dl === 0 ? '#dc2626' : dl <= 2 ? '#d97706' : '#2563eb' }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-[13px]">{m.title}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      {dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-3 text-[11px] text-gray-500">
                      <span>{c?.name || '—'}</span>
                      <span>{m.time}</span>
                      <span>{m.duration}min</span>
                      <span className="capitalize">{m.platform || m.type}</span>
                    </div>
                    {m.meetLink && (
                      <a 
                        href={m.meetLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                      >
                        Join <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <ShieldAlert size={15} className="text-amber-600" />
            <h3 className="text-[14px] font-semibold flex-1">Compliance Deadlines — Next 7 Days</h3>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            {urgent.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>No urgent deadlines.</p></div>}
            {urgent.map(d => {
              const dl = daysLeft(d.dueDate) || 0;
              return (
                <div key={d.id} className="flex items-center gap-2.5 px-4.5 py-2.5 border-b border-gray-100">
                  <TypeChip type={d.category} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px]">{d.title}</div>
                    <div className="text-[11px] text-gray-500">{d.clients} clients · {d.form}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${dl <= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    {dl === 0 ? 'Today' : `${dl}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <Users size={15} className="text-purple-600" />
            <h3 className="text-[14px] font-semibold flex-1">Team Workload</h3>
          </div>
          <div className="p-4.5 overflow-y-auto max-h-[300px]">
            {users.map(u => {
              const ut = tasks.filter(t => t.assigneeId === u.id && t.status !== 'Completed');
              const max = Math.max(...users.map(x => tasks.filter(t => t.assigneeId === x.id && t.status !== 'Completed').length), 1);
              return (
                <div key={u.id} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar user={u} size={24} />
                    <span className="text-[13px] font-medium flex-1">{u.name}</span>
                    <span className="text-[12px] text-gray-500">{ut.length} active</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct(ut.length, max)}%`, background: u.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
