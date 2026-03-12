import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { daysLeft, STATUS_COLORS, PRIORITY_COLORS } from '../utils';
import { Plus, Search, ChevronDown, ChevronUp, Check, Trash2, Maximize2, ListTodo, GitMerge } from 'lucide-react';
import { motion } from 'motion/react';
import { TypeChip, StatusBadge, PriorityBadge } from '../components/ui/Badges';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { IconRenderer } from '../components/ui/IconRenderer';
import { Task } from '../types';

export function TasksPage() {
  const { tasks, setTasks, clients, users, taskTypes } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterIssueType, setFilterIssueType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortCol, setSortCol] = useState<keyof typeof tasks[0]>('dueDate');
  const [sortDir, setSortDir] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const sort = (col: keyof typeof tasks[0]) => {
    setSortCol(col);
    setSortDir(d => sortCol === col ? -d : 1);
  };

  const openNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    toast('Task updated', 'success');
  };

  const filtered = useMemo(() => {
    let t = tasks;
    if (tab === 'mine') t = t.filter(x => x.assigneeId === 'u1'); // Assuming u1 is current user
    if (tab === 'overdue') t = t.filter(x => x.status !== 'Completed' && (daysLeft(x.dueDate) ?? 0) < 0);
    if (tab === 'recurring') t = t.filter(x => x.recurring && x.recurring !== 'One-time');
    if (tab === 'completed') t = t.filter(x => x.status === 'Completed');
    
    if (search) {
      const s = search.toLowerCase();
      t = t.filter(x => 
        x.title.toLowerCase().includes(s) || 
        x.id.toLowerCase().includes(s) ||
        clients.find(c => c.id === x.clientId)?.name.toLowerCase().includes(s)
      );
    }
    if (filterStatus) t = t.filter(x => x.status === filterStatus);
    if (filterClient) t = t.filter(x => x.clientId === filterClient);
    if (filterType) t = t.filter(x => x.type === filterType);
    if (filterIssueType) t = t.filter(x => x.issueType === filterIssueType);
    if (filterPriority) t = t.filter(x => x.priority === filterPriority);
    
    return [...t].sort((a, b) => {
      const av = sortCol === 'dueDate' ? (a[sortCol] || '9999-99-99') : (a[sortCol] || '');
      const bv = sortCol === 'dueDate' ? (b[sortCol] || '9999-99-99') : (b[sortCol] || '');
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });
  }, [tasks, clients, tab, search, filterStatus, filterClient, filterType, filterIssueType, filterPriority, sortCol, sortDir]);

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(filtered.map(t => t.id));
  const clearSelect = () => setSelected([]);
  
  const bulkComplete = () => {
    setTasks(tasks.map(t => selected.includes(t.id) ? { ...t, status: 'Completed' } : t));
    clearSelect();
    toast(`${selected.length} tasks marked complete`, 'success');
  };
  
  const bulkDelete = () => {
    if (confirm(`Delete ${selected.length} tasks?`)) {
      setTasks(tasks.filter(t => !selected.includes(t.id)));
      clearSelect();
      toast('Tasks deleted');
    }
  };

  const SH = ({ col, label }: { col: keyof typeof tasks[0], label: string }) => (
    <th className="cursor-pointer select-none hover:bg-gray-100 transition-colors px-3.5 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider" onClick={() => sort(col)}>
      <span className="flex items-center gap-1">
        {label}
        {sortCol === col && (sortDir === 1 ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
      </span>
    </th>
  );

  return (
    <div className="h-full">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <h1 className="font-serif text-[22px] font-semibold text-gray-900">All Tasks</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{filtered.length} tasks</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors" onClick={openNewTask}>
          <Plus size={15} /> New Task
        </button>
      </div>

      <div className="flex border-b border-gray-200 gap-0.5 px-1 mb-4">
        {[
          ['all', 'All'], ['mine', 'Mine'], ['overdue', 'Overdue'], 
          ['recurring', 'Recurring'], ['completed', 'Completed']
        ].map(([v, l]) => (
          <button 
            key={v} 
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-[1px] ${tab === v ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            onClick={() => setTab(v)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center flex-wrap mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-[220px] focus-within:border-blue-600 transition-colors">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input 
            placeholder="Search tasks or IDs..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
          />
        </div>
        <select className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {['GST', 'TDS', 'ITR', 'ROC', 'Audit', 'MCA', 'Advance Tax', 'FEMA', 'Labour', 'Other'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filterIssueType} onChange={e => setFilterIssueType(e.target.value)}>
          <option value="">All Issue Types</option>
          {taskTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <select className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        {(search || filterStatus || filterClient || filterType || filterIssueType || filterPriority) && (
          <button 
            className="px-2.5 py-1.5 text-[12.5px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterClient(''); setFilterType(''); setFilterIssueType(''); setFilterPriority(''); }}
          >
            Clear filters
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-[12.5px] text-gray-600 cursor-pointer hover:text-gray-900">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={showSubtasks}
              onChange={e => setShowSubtasks(e.target.checked)}
            />
            Show Subtasks
          </label>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50 border border-blue-100 rounded-lg mb-3.5 animate-slide-down">
          <Check size={14} className="text-blue-600" />
          <span className="text-[13px] font-semibold text-blue-600">{selected.length} selected</span>
          <button className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1 transition-colors" onClick={bulkComplete}>
            <Check size={12} /> Mark Complete
          </button>
          <button className="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1 transition-colors" onClick={bulkDelete}>
            <Trash2 size={12} /> Delete
          </button>
          <button className="ml-auto text-[12px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-blue-100/50" onClick={clearSelect}>
            Clear
          </button>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3.5 py-2.5 w-10">
                <input 
                  type="checkbox" 
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  onChange={e => e.target.checked ? selectAll() : clearSelect()} 
                  checked={selected.length === filtered.length && filtered.length > 0} 
                />
              </th>
              <SH col="id" label="ID" />
              <SH col="title" label="Task" />
              <SH col="parentId" label="Parent" />
              <SH col="clientId" label="Client" />
              <SH col="type" label="Type" />
              <SH col="status" label="Status" />
              <SH col="priority" label="Priority" />
              <SH col="assigneeId" label="Assignee" />
              <SH col="dueDate" label="Due Date" />
              <th className="px-3.5 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-gray-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
                    <ListTodo size={32} className="opacity-30" />
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-700 text-[15px]">No tasks found</h3>
                      <p className="text-[13px] mt-1">Try adjusting filters or create a new task.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map(t => {
              const c = clients.find(x => x.id === t.clientId);
              const a = users.find(x => x.id === t.assigneeId);
              const dl = daysLeft(t.dueDate);
              const isSelected = selected.includes(t.id);
              const taskType = taskTypes.find(type => type.name === (t.issueType || 'Task'));
              const childTasks = tasks.filter(x => x.parentId === t.id);
              const parentTask = t.parentId ? tasks.find(x => x.id === t.parentId) : null;
              
              let dueClass = "text-gray-500";
              let rowClass = "";
              if (dl !== null) {
                if (dl < 0) {
                  dueClass = "text-red-600 font-bold";
                  rowClass = "bg-red-50/30";
                } else if (dl <= 2) {
                  dueClass = "text-orange-600 font-bold";
                  rowClass = "bg-orange-50/30";
                } else {
                  dueClass = "text-gray-400";
                }
              }
              
              return (
                <React.Fragment key={t.id}>
                  <tr className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-blue-50/30' : rowClass ? `${rowClass} hover:opacity-80` : 'hover:bg-gray-50'}`}>
                    <td className="px-3.5 py-2.5">
                      <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected} 
                        onChange={() => toggleSelect(t.id)} 
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5" title={taskType?.name}>
                        {taskType && (
                          <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: taskType.color }}>
                            <IconRenderer name={taskType.icon} size={10} />
                          </div>
                        )}
                        <span className="text-[11px] font-mono text-gray-400">#{t.id}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => openEditTask(t)}>{t.title}</div>
                        {childTasks.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded" title={`${childTasks.filter(s => s.status === 'Completed').length}/${childTasks.length} subtasks done`}>
                            <GitMerge size={10} />
                            <span>{childTasks.filter(s => s.status === 'Completed').length}/{childTasks.length}</span>
                          </div>
                        )}
                      </div>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {t.tags.map(g => <span key={g} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{g}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {parentTask ? (
                        <div className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit" title={`Parent: ${parentTask.title}`}>
                          ↑ #{parentTask.id}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-[12px] text-gray-500">{c?.name || '—'}</td>
                    <td className="px-3.5 py-2.5"><TypeChip type={t.type} /></td>
                    <td className="px-3.5 py-2.5">
                      <select 
                        className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                        value={t.status}
                        onChange={e => updateTask(t.id, { status: e.target.value })}
                      >
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <select 
                        className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                        value={t.priority}
                        onChange={e => updateTask(t.id, { priority: e.target.value })}
                      >
                        {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 relative group">
                        <Avatar user={a} size={22} />
                        <select 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={t.assigneeId}
                          onChange={e => updateTask(t.id, { assigneeId: e.target.value })}
                          title="Change Assignee"
                        >
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <span className="text-[12px] group-hover:text-blue-600 transition-colors">{a?.name?.split(' ')[0] || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          className={`bg-transparent border-none outline-none text-[12px] cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 w-[110px] ${dl !== null && dl < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}
                          value={t.dueDate}
                          onChange={e => updateTask(t.id, { dueDate: e.target.value })}
                        />
                        {dl !== null && (
                          <span className={`text-[10px] font-semibold ${dueClass}`}>
                            {dl < 0 ? `${Math.abs(dl)}d late` : dl === 0 ? 'Today' : `${dl}d`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1">
                        <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors" onClick={() => openEditTask(t)}>
                          <Maximize2 size={13} />
                        </button>
                        <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => {
                          if (confirm('Delete task?')) {
                            setTasks(tasks.filter(x => x.id !== t.id));
                            toast('Task deleted');
                          }
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showSubtasks && childTasks.length > 0 && childTasks.map((s) => {
                    const sc = clients.find(x => x.id === s.clientId);
                    const sa = users.find(x => x.id === s.assigneeId);
                    const sdl = daysLeft(s.dueDate);
                    const sIsSelected = selected.includes(s.id);
                    const sTaskType = taskTypes.find(type => type.name === (s.issueType || 'Subtask'));
                    
                    let sDueClass = "text-gray-500";
                    let sRowClass = "";
                    if (sdl !== null) {
                      if (sdl < 0) {
                        sDueClass = "text-red-600 font-bold";
                        sRowClass = "bg-red-50/20";
                      } else if (sdl <= 2) {
                        sDueClass = "text-orange-600 font-bold";
                        sRowClass = "bg-orange-50/20";
                      } else {
                        sDueClass = "text-gray-400";
                      }
                    }

                    return (
                      <tr key={s.id} className={`border-b border-gray-100 transition-colors ${sIsSelected ? 'bg-blue-50/30' : sRowClass ? `${sRowClass} hover:opacity-80` : 'bg-gray-50/30 hover:bg-gray-50'}`}>
                        <td className="px-3.5 py-2.5 pl-8 text-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block mr-2" />
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={sIsSelected} 
                            onChange={() => toggleSelect(s.id)} 
                          />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5" title={sTaskType?.name}>
                            {sTaskType && (
                              <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: sTaskType.color }}>
                                <IconRenderer name={sTaskType.icon} size={10} />
                              </div>
                            )}
                            <span className="text-[11px] font-mono text-gray-400">#{s.id}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`font-medium cursor-pointer hover:underline ${s.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700'}`} onClick={() => openEditTask(s)}>{s.title}</div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit" title={`Parent: ${t.title}`}>
                            ↑ #{t.id}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-[12px] text-gray-500">{sc?.name || '—'}</td>
                        <td className="px-3.5 py-2.5"><TypeChip type={s.type} /></td>
                        <td className="px-3.5 py-2.5">
                          <select 
                            className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                            value={s.status}
                            onChange={e => updateTask(s.id, { status: e.target.value })}
                          >
                            {Object.keys(STATUS_COLORS).map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <select 
                            className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                            value={s.priority}
                            onChange={e => updateTask(s.id, { priority: e.target.value })}
                          >
                            {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 relative group">
                            <Avatar user={sa} size={22} />
                            <select 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              value={s.assigneeId}
                              onChange={e => updateTask(s.id, { assigneeId: e.target.value })}
                              title="Change Assignee"
                            >
                              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <span className="text-[12px] group-hover:text-blue-600 transition-colors">{sa?.name?.split(' ')[0] || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              className={`bg-transparent border-none outline-none text-[12px] cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 w-[110px] ${sdl !== null && sdl < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}
                              value={s.dueDate}
                              onChange={e => updateTask(s.id, { dueDate: e.target.value })}
                            />
                            {sdl !== null && (
                              <span className={`text-[10px] font-semibold ${sDueClass}`}>
                                {sdl < 0 ? `${Math.abs(sdl)}d late` : sdl === 0 ? 'Today' : `${sdl}d`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1">
                            <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors" onClick={() => openEditTask(s)}>
                              <Maximize2 size={13} />
                            </button>
                            <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => {
                              if (confirm('Delete subtask?')) {
                                setTasks(tasks.filter(x => x.id !== s.id));
                                toast('Subtask deleted');
                              }
                            }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
