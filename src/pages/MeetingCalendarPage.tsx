import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, Calendar as CalendarIcon, List, Edit2, Trash2, Video, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { genId, fmt, today, daysLeft, fmtDateShort } from '../utils';
import { Meeting } from '../types';

export function MeetingCalendarPage() {
  const { meetings, setMeetings, clients, users } = useApp();
  const toast = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Meeting | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const PLATFORMS = [
    { id: 'google_meet', label: 'Google Meet', color: '#4285f4' },
    { id: 'zoom', label: 'Zoom', color: '#2d8cff' },
    { id: 'microsoft_teams', label: 'Microsoft Teams', color: '#5558af' },
    { id: 'phone', label: 'Phone Call', color: '#059669' },
    { id: 'in_person', label: 'In Person', color: '#d97706' },
  ];

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getMeetingsForDate = (date: Date) => {
    const ds = fmt(date);
    return meetings.filter(m => m.date === ds);
  };
  
  const calDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const openNew = (date?: Date) => {
    const d = date || today;
    setForm({ id: genId(), title: '', clientId: '', type: 'Video Call', platform: 'google_meet', meetLink: '', date: fmt(d), time: '10:00', duration: 60, attendees: ['u1'], description: '', status: 'scheduled' });
    setModal(true);
  };
  
  const openEdit = (m: Meeting) => {
    setForm({ ...m, attendees: [...m.attendees] });
    setModal(true);
  };

  const save = () => {
    if (!form?.title || !form?.date || !form?.time) { toast('Title, date and time are required', 'error'); return; }
    if (meetings.find(m => m.id === form.id)) {
      setMeetings(m => m.map(x => x.id === form.id ? form : x));
    } else {
      setMeetings(m => [...m, form]);
    }
    toast(form.id && meetings.find(m => m.id === form.id) ? 'Meeting updated' : 'Meeting scheduled', 'success');
    setModal(false);
    setForm(null);
  };

  const delMeeting = (id: string) => {
    if (confirm('Delete meeting?')) {
      setMeetings(m => m.filter(x => x.id !== id));
      toast('Meeting deleted');
    }
  };

  const toggleAttendee = (id: string) => {
    setForm(f => f ? { ...f, attendees: f.attendees.includes(id) ? f.attendees.filter(x => x !== id) : [...f.attendees, id] } : null);
  };

  const upcoming = meetings.filter(m => (daysLeft(m.date) ?? -1) >= 0).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = meetings.filter(m => (daysLeft(m.date) ?? 0) < 0).sort((a, b) => b.date.localeCompare(a.date));

  const MeetingRow = ({ m }: { m: Meeting }) => {
    const c = clients.find(x => x.id === m.clientId);
    const pl = PLATFORMS.find(p => p.id === m.platform) || PLATFORMS[4];
    const dl = daysLeft(m.date) ?? 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-md transition-all border-l-[3px]" style={{ borderLeftColor: dl < 0 ? '#9ca3af' : dl === 0 ? '#dc2626' : dl <= 2 ? '#d97706' : '#2563eb' }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-semibold text-[14px] text-gray-900">{m.title}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dl < 0 ? 'bg-gray-100 text-gray-500' : dl === 0 ? 'bg-red-50 text-red-600' : dl <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {dl < 0 ? 'Completed' : dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : fmtDateShort(m.date)}
              </span>
            </div>
            <div className="flex gap-3 text-[12px] text-gray-500 flex-wrap mb-2">
              <span className="font-medium text-gray-700">{c?.name || '—'}</span>
              <span>•</span>
              <span>{m.date} at {m.time}</span>
              <span>•</span>
              <span>{m.duration}min</span>
              <span>•</span>
              <span>{pl.label}</span>
            </div>
            {m.description && <p className="text-[12px] text-gray-600 mb-3 line-clamp-2">{m.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-1.5">
                {m.attendees.map(id => {
                  const u = users.find(x => x.id === id);
                  return <div key={id} className="ring-2 ring-white rounded-full"><Avatar user={u} size={22} /></div>;
                })}
              </div>
              {m.meetLink && (
                <a href={m.meetLink} target="_blank" rel="noopener noreferrer" className="ml-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors">
                  <Video size={12} /> Join
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => openEdit(m)}><Edit2 size={13} /></button>
            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => delMeeting(m.id)}><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex-1">
          <h1 className="font-serif text-[22px] font-semibold text-gray-900">Meeting Calendar</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Schedule and manage client meetings</p>
        </div>
        <div className="flex gap-2 bg-white border border-gray-200 p-1 rounded-lg">
          <button className={`px-3 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors ${view === 'calendar' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setView('calendar')}>
            <CalendarIcon size={14} /> Calendar
          </button>
          <button className={`px-3 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setView('list')}>
            <List size={14} /> List
          </button>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors ml-2" onClick={() => openNew()}>
          <Plus size={15} /> Schedule Meeting
        </button>
      </div>

      {view === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
              <ChevronLeft size={16} />
            </button>
            <h3 className="font-serif text-[18px] font-semibold text-gray-900">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 bg-gray-200 gap-[1px]">
            {calDays.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} className="bg-gray-50 min-h-[100px]"></div>;
              const ds = fmt(d);
              const dm = getMeetingsForDate(d);
              const isToday = fmt(today) === ds;
              const isSel = selectedDate === ds;
              
              return (
                <div 
                  key={ds} 
                  className={`bg-white min-h-[100px] p-1.5 cursor-pointer transition-colors relative group ${isToday ? 'bg-blue-50/30' : 'hover:bg-gray-50'} ${isSel ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}
                  onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dm.slice(0, 3).map(m => {
                      const pl = PLATFORMS.find(p => p.id === m.platform);
                      return (
                        <div 
                          key={m.id} 
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ background: (pl?.color || '#2563eb') + '22', color: pl?.color || '#2563eb' }}
                          onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                        >
                          {m.time} {m.title}
                        </div>
                      );
                    })}
                    {dm.length > 3 && <div className="text-[10px] text-gray-400 font-medium px-1">+{dm.length - 3} more</div>}
                  </div>
                  <button 
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onClick={(e) => { e.stopPropagation(); openNew(d); }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            <div className="text-[13px] font-bold text-gray-900 mb-3 px-1">Upcoming ({upcoming.length})</div>
            {upcoming.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                <p>No upcoming meetings.</p>
              </div>
            )}
            {upcoming.map(m => <MeetingRow key={m.id} m={m} />)}
          </div>
          <div>
            <div className="text-[13px] font-bold text-gray-900 mb-3 px-1">Past ({past.length})</div>
            {past.slice(0, 5).map(m => <MeetingRow key={m.id} m={m} />)}
          </div>
        </div>
      )}

      {modal && form && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-600" />
              {form.id && meetings.find(m => m.id === form.id) ? 'Edit Meeting' : 'Schedule Meeting'}
            </div>
          }
          onClose={() => setModal(false)}
          size="lg"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(false)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Schedule Meeting</button>
            </>
          }
        >
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Meeting Title *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="e.g., GST Filing Discussion — Agarwal Exports" value={form.title} onChange={e => setForm(f => f ? { ...f, title: e.target.value } : null)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Client</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.clientId} onChange={e => setForm(f => f ? { ...f, clientId: e.target.value } : null)}>
                <option value="">Select client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Platform</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.platform} onChange={e => setForm(f => f ? { ...f, platform: e.target.value } : null)}>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Date *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" type="date" value={form.date} onChange={e => setForm(f => f ? { ...f, date: e.target.value } : null)} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Time *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" type="time" value={form.time} onChange={e => setForm(f => f ? { ...f, time: e.target.value } : null)} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Duration (min)</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.duration} onChange={e => setForm(f => f ? { ...f, duration: Number(e.target.value) } : null)}>
                {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          
          {(form.platform === 'google_meet' || form.platform === 'zoom' || form.platform === 'microsoft_teams') && (
            <div className="mb-4">
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Meeting Link</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" type="url" placeholder="https://meet.google.com/..." value={form.meetLink || ''} onChange={e => setForm(f => f ? { ...f, meetLink: e.target.value } : null)} />
              <p className="text-[11px] text-gray-400 mt-1.5">Paste Google Meet, Zoom, or Teams link here. In production, this auto-generates via API integration.</p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-2">Attendees</label>
            <div className="flex gap-2 flex-wrap">
              {users.map(u => {
                const isSelected = form.attendees.includes(u.id);
                return (
                  <div 
                    key={u.id} 
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    onClick={() => toggleAttendee(u.id)}
                  >
                    <Avatar user={u} size={20} />
                    <span className={`text-[12px] ${isSelected ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>{u.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mb-5">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Agenda / Notes</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 min-h-[80px] resize-y" placeholder="Meeting agenda, topics to discuss..." value={form.description || ''} onChange={e => setForm(f => f ? { ...f, description: e.target.value } : null)} />
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2.5 text-[12.5px] text-blue-800">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>Calendar invites and automated reminders will be sent to attendees when email integration is connected.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
