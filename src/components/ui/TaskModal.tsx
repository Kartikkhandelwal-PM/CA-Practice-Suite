import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Task, Subtask, Comment, Attachment } from '../../types';
import { genId, fmt, today, STATUS_COLORS, PRIORITY_COLORS, TYPE_COLORS } from '../../utils';
import { TagInput } from './TagInput';
import { SearchableSelect } from './SearchableSelect';
import { IconRenderer } from './IconRenderer';
import { RichTextEditor } from './RichTextEditor';
import { Plus, X, Trash2, Paperclip, MessageSquare, Clock, User, GitMerge } from 'lucide-react';
import { Avatar } from './Avatar';

interface TaskModalProps {
  task?: Task | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const { tasks, setTasks, clients, users, templates, taskTypes } = useApp();
  const toast = useToast();

  const [form, setForm] = useState<Task>(task || {
    id: '', // Empty ID means new task
    title: '',
    clientId: '',
    type: 'GST',
    issueType: 'Task',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u1',
    reporterId: 'u1',
    reviewerId: '',
    dueDate: fmt(today),
    createdAt: fmt(today),
    recurring: 'One-time',
    description: '',
    tags: [],
    comments: [],
    attachments: [],
    activity: [{ text: 'Task created', at: fmt(today) }]
  });

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newComment, setNewComment] = useState('');
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([]);

  const isNew = !form.id;
  const childTasks = tasks.filter(t => t.parentId === form.id);

  const save = () => {
    if (!form.title || !form.clientId || !form.dueDate) {
      toast('Title, Client, and Due Date are required', 'error');
      return;
    }
    
    if (isNew) {
      // Find max ID for KDK prefix
      let max = 0;
      tasks.forEach(t => {
        if (t.id.startsWith('KDK-')) {
          const num = parseInt(t.id.split('-')[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      });
      const newId = `KDK-${max + 1}`;
      const newTask = { ...form, id: newId };
      const newTasks = [newTask];
      
      let currentMax = max + 1;
      pendingSubtasks.forEach((stTitle) => {
        currentMax++;
        newTasks.push({
          id: `KDK-${currentMax}`,
          title: stTitle,
          clientId: form.clientId,
          type: form.type,
          issueType: 'Subtask',
          status: 'To Do',
          priority: form.priority,
          assigneeId: form.assigneeId,
          reporterId: 'u1',
          reviewerId: '',
          dueDate: form.dueDate,
          createdAt: fmt(today),
          recurring: 'One-time',
          description: '',
          tags: [],
          parentId: newId,
          comments: [],
          attachments: [],
          activity: [{ text: 'Subtask created from template', at: fmt(today) }]
        });
      });
      
      setTasks([...newTasks, ...tasks]);
      toast('Task created', 'success');
    } else {
      const changes: string[] = [];
      if (task) {
        if (task.status !== form.status) changes.push(`Status changed to ${form.status}`);
        if (task.assigneeId !== form.assigneeId) {
           const assignee = users.find(u => u.id === form.assigneeId)?.name || 'Unassigned';
           changes.push(`Assigned to ${assignee}`);
        }
        if (task.dueDate !== form.dueDate) changes.push(`Due date changed to ${form.dueDate}`);
        if (task.priority !== form.priority) changes.push(`Priority changed to ${form.priority}`);
        if (task.description !== form.description) changes.push(`Description updated`);
      }
      
      let updatedForm = { ...form };
      if (changes.length > 0) {
        updatedForm.activity = [
          ...changes.map(c => ({ text: c, at: fmt(today) })),
          ...(form.activity || [])
        ];
      }
      
      setTasks(tasks.map(t => t.id === form.id ? updatedForm : t));
      toast('Task updated', 'success');
    }
    onClose();
  };

  const applyTemplate = (tid: string) => {
    setSelectedTemplate(tid);
    const tmpl = templates.find(t => t.id === tid);
    if (tmpl) {
      setForm(f => ({
        ...f,
        type: tmpl.category,
        description: f.description ? `${f.description}\n\n${tmpl.description}` : tmpl.description,
      }));
      
      if (tmpl.subtasks && tmpl.subtasks.length > 0) {
        if (isNew) {
          setPendingSubtasks(prev => [...prev, ...tmpl.subtasks!]);
          toast(`${tmpl.subtasks.length} subtasks will be added upon saving`, 'success');
        } else {
          let max = 0;
          tasks.forEach(t => {
            if (t.id.startsWith('KDK-')) {
              const num = parseInt(t.id.split('-')[1], 10);
              if (!isNaN(num) && num > max) max = num;
            }
          });
          let currentMax = max;
          const newSubtasks = tmpl.subtasks.map(stTitle => {
            currentMax++;
            return {
              id: `KDK-${currentMax}`,
              title: stTitle,
              clientId: form.clientId,
              type: tmpl.category,
              issueType: 'Subtask',
              status: 'To Do',
              priority: form.priority,
              assigneeId: form.assigneeId,
              reporterId: 'u1',
              reviewerId: '',
              dueDate: form.dueDate,
              createdAt: fmt(today),
              recurring: 'One-time',
              description: '',
              tags: [],
              parentId: form.id,
              comments: [],
              attachments: [],
              activity: [{ text: 'Subtask created from template', at: fmt(today) }]
            };
          });
          setTasks([...newSubtasks, ...tasks]);
          toast(`${newSubtasks.length} subtasks added from template`, 'success');
        }
      }
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = { id: genId(), userId: 'u1', text: newComment, createdAt: new Date().toISOString() };
    setForm(f => ({ ...f, comments: [...(f.comments || []), comment], activity: [{ text: 'Added a comment', at: fmt(today) }, ...(f.activity || [])] }));
    setNewComment('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const attachment: Attachment = { id: genId(), name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type };
      setForm(f => ({ ...f, attachments: [...(f.attachments || []), attachment], activity: [{ text: `Attached ${file.name}`, at: fmt(today) }, ...(f.activity || [])] }));
    }
  };

  const createQuickSubtask = () => {
    let max = 0;
    tasks.forEach(t => {
      if (t.id.startsWith('KDK-')) {
        const num = parseInt(t.id.split('-')[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    const newId = `KDK-${max + 1}`;
    
    const newTask: Task = {
      id: newId,
      title: 'New Subtask',
      clientId: form.clientId,
      type: form.type,
      issueType: 'Subtask',
      status: 'To Do',
      priority: form.priority,
      assigneeId: form.assigneeId,
      reporterId: 'u1',
      reviewerId: '',
      dueDate: form.dueDate,
      createdAt: fmt(today),
      recurring: 'One-time',
      description: '',
      tags: [],
      parentId: form.id,
      comments: [],
      attachments: [],
      activity: [{ text: 'Subtask created', at: fmt(today) }]
    };
    setTasks([newTask, ...tasks]);
    toast('Subtask created', 'success');
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const userOptions = users.map(u => ({ value: u.id, label: u.name }));
  const typeOptions = Object.keys(TYPE_COLORS).map(t => ({ value: t, label: t }));
  const statusOptions = Object.keys(STATUS_COLORS).map(s => ({ value: s, label: s }));
  const priorityOptions = Object.keys(PRIORITY_COLORS).map(p => ({ value: p, label: p }));
  const parentOptions = [{ value: '', label: 'None' }, ...tasks.filter(t => t.id !== form.id && !t.parentId).map(t => ({ value: t.id, label: `#${t.id} - ${t.title}` }))];
  const issueTypeOptions = taskTypes.map(t => ({ 
    value: t.name, 
    label: (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: t.color }}>
          <IconRenderer name={t.icon} size={10} />
        </div>
        <span>{t.name}</span>
      </div>
    ),
    searchLabel: t.name
  }));

  const currentTaskType = taskTypes.find(t => t.name === (form.issueType || 'Task'));

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          {currentTaskType && (
            <div className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: currentTaskType.color }}>
              <IconRenderer name={currentTaskType.icon} size={14} />
            </div>
          )}
          <span className="text-gray-500 font-mono text-sm">{!isNew ? form.id : 'New Task'}</span>
        </div>
      }
      onClose={onClose}
      size="4xl"
      footer={
        <>
          <button className="px-4 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm" onClick={save}>{!isNew ? 'Save Changes' : 'Create Task'}</button>
        </>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
        {/* Left Column: Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          <div>
            <input 
              className="w-full px-0 py-2 border-none text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 bg-transparent" 
              placeholder="Task summary or title..." 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Description</label>
            <RichTextEditor 
              content={form.description || ''} 
              onChange={content => setForm({ ...form, description: content })} 
              placeholder="Add a more detailed description..."
            />
          </div>

          {!isNew && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-2">
                  <GitMerge size={16} className="text-gray-400" />
                  Subtasks
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[11px] font-medium">{childTasks.length}</span>
                </label>
                <button className="text-blue-600 hover:text-blue-700 text-[12px] font-medium flex items-center gap-1 transition-colors" onClick={createQuickSubtask}>
                  <Plus size={14} /> Add Subtask
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {childTasks.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {childTasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                          checked={s.status === 'Completed'} 
                          onChange={e => setTasks(tasks.map(t => t.id === s.id ? { ...t, status: e.target.checked ? 'Completed' : 'To Do' } : t))} 
                        />
                        <div className="flex-1 min-w-0">
                          <input 
                            className={`w-full bg-transparent border-none p-0 text-[13px] outline-none focus:ring-0 ${s.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`} 
                            value={s.title} 
                            onChange={e => setTasks(tasks.map(t => t.id === s.id ? { ...t, title: e.target.value } : t))} 
                            placeholder="Subtask title" 
                          />
                        </div>
                        <div className="w-[120px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <SearchableSelect options={userOptions} value={s.assigneeId || ''} onChange={v => setTasks(tasks.map(t => t.id === s.id ? { ...t, assigneeId: v } : t))} placeholder="Assignee" />
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" onClick={() => { if(confirm('Delete subtask?')) setTasks(tasks.filter(t => t.id !== s.id)) }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-[13px] bg-gray-50/50">
                    No subtasks added yet. Break down this task into smaller steps.
                  </div>
                )}
              </div>
            </div>
          )}

          {!isNew && (
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-400" />
                Activity & Comments
              </label>
              
              <div className="space-y-4 mb-4">
                {(form.comments || []).map(c => {
                  const u = users.find(x => x.id === c.userId);
                  return (
                    <div key={c.id} className="flex gap-3">
                      <Avatar user={u} size={32} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[13px] text-gray-900">{u?.name || 'Unknown'}</span>
                          <span className="text-[11px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-[13px] text-gray-700 whitespace-pre-wrap shadow-sm">
                          {c.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-start gap-3">
                <Avatar user={users[0]} size={32} />
                <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                  <textarea 
                    className="w-full px-3 py-2 border-none text-[13.5px] outline-none min-h-[80px] resize-y bg-transparent" 
                    placeholder="Add a comment..." 
                    value={newComment} 
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-2 py-2 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <label className="w-8 h-8 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors" title="Attach file">
                        <Paperclip size={15} />
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                    <button 
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-[12px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      onClick={addComment}
                      disabled={!newComment.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="w-full md:w-80 shrink-0 space-y-5">
          {isNew && templates.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
              <label className="block text-[11.5px] font-semibold text-blue-800 mb-1.5 uppercase tracking-wider">Apply Template</label>
              <SearchableSelect options={templates.map(t => ({ value: t.id, label: t.name }))} value={selectedTemplate} onChange={applyTemplate} placeholder="Select a template..." />
            </div>
          )}

          <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
              <SearchableSelect options={statusOptions} value={form.status} onChange={v => setForm({ ...form, status: v })} />
            </div>
            
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Client *</label>
              <SearchableSelect options={clientOptions} value={form.clientId} onChange={v => setForm({ ...form, clientId: v })} placeholder="Select Client" />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Assignee</label>
              <SearchableSelect options={userOptions} value={form.assigneeId} onChange={v => setForm({ ...form, assigneeId: v })} />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Reporter</label>
              <SearchableSelect options={userOptions} value={form.reporterId || ''} onChange={v => setForm({ ...form, reporterId: v })} />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Due Date *</label>
              <input 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" 
                type="date" 
                value={form.dueDate} 
                onChange={e => setForm({ ...form, dueDate: e.target.value })} 
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Issue Type</label>
              <SearchableSelect options={issueTypeOptions} value={form.issueType || 'Task'} onChange={v => setForm({ ...form, issueType: v })} />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Priority</label>
              <SearchableSelect options={priorityOptions} value={form.priority} onChange={v => setForm({ ...form, priority: v })} />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Type</label>
              <SearchableSelect options={typeOptions} value={form.type} onChange={v => setForm({ ...form, type: v })} />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Parent Task</label>
              <SearchableSelect options={parentOptions} value={form.parentId || ''} onChange={v => setForm({ ...form, parentId: v || undefined })} placeholder="None" />
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tags</label>
              <TagInput tags={form.tags || []} onChange={v => setForm({ ...form, tags: v })} />
            </div>
          </div>
          
          {!isNew && form.attachments && form.attachments.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Paperclip size={14} />
                Attachments ({form.attachments.length})
              </label>
              <div className="space-y-2">
                {form.attachments.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100 group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip size={14} className="text-gray-400 shrink-0" />
                      <span className="text-[12px] text-gray-700 truncate">{a.name}</span>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setForm({ ...form, attachments: form.attachments?.filter(x => x.id !== a.id) })}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
