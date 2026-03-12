import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Mail, Search, Inbox, Send, Archive, Star, Clock, Paperclip, CheckCircle2, MoreVertical, Sparkles, Plus } from 'lucide-react';
import { Email } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { genId, fmt, today } from '../utils';

export function InboxPage() {
  const { emails, setEmails, tasks, setTasks, clients } = useApp();
  const toast = useToast();

  const [filter, setFilter] = useState<'inbox' | 'sent' | 'archive'>('inbox');
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [draftReply, setDraftReply] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const filteredEmails = emails.filter(e => {
    // Mocking folder logic since we don't have it in Email type yet, assuming all are inbox for now unless read=true and we want to archive
    if (filter === 'archive' && !e.read) return false;
    if (filter === 'inbox' && e.read && filter !== 'inbox') return false; // Just a simple mock filter
    
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.from.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
    setDraftReply('');
  };

  const generateAIDraft = () => {
    setIsDrafting(true);
    setTimeout(() => {
      setDraftReply(`Dear ${selectedEmail?.from.split(' ')[0]},\n\nThank you for your email regarding "${selectedEmail?.subject}".\n\nI have received the documents and will process them shortly. I will let you know if anything else is required.\n\nBest regards,\nRajesh Sharma\nKDK Firm`);
      setIsDrafting(false);
      toast('AI Draft generated', 'success');
    }, 1500);
  };

  const sendReply = () => {
    if (!draftReply.trim()) return;
    toast('Reply sent successfully', 'success');
    setDraftReply('');
  };

  const createTaskFromEmail = () => {
    setIsTaskModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col animate-slide-up">
      <div className="flex items-start justify-between mb-5 shrink-0">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-gray-900">Inbox & Communications</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage client emails and create tasks directly</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors">
          <Mail size={15} /> Compose
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex overflow-hidden min-h-[500px]">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50 p-3">
          <div className="space-y-1">
            <button 
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${filter === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setFilter('inbox')}
            >
              <div className="flex items-center gap-2"><Inbox size={16} /> Inbox</div>
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{emails.filter(e => !e.read).length}</span>
            </button>
            <button 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${filter === 'sent' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setFilter('sent')}
            >
              <Send size={16} /> Sent
            </button>
            <button 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${filter === 'archive' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setFilter('archive')}
            >
              <Archive size={16} /> Archive
            </button>
          </div>
          
          <div className="mt-6">
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 px-3">Integrations</div>
            <div className="px-3 space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Gmail Connected
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Outlook Connected
              </div>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="w-[350px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-blue-600 focus-within:bg-white transition-colors">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input 
                placeholder="Search emails..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredEmails.map(email => (
              <div 
                key={email.id} 
                className={`p-3.5 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedEmail?.id === email.id ? 'bg-blue-50/50' : ''} ${!email.read ? 'bg-white' : 'bg-gray-50/30'}`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[13px] truncate pr-2 ${!email.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{email.from}</span>
                  <span className={`text-[11px] shrink-0 ${!email.read ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>{email.time}</span>
                </div>
                <div className={`text-[12.5px] truncate mb-1 ${!email.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{email.subject}</div>
                <div className="text-[12px] text-gray-500 truncate">{email.preview}</div>
                
                <div className="flex items-center gap-2 mt-2">
                  {email.attachments.length > 0 && <Paperclip size={12} className="text-gray-400" />}
                  {email.taskLinked && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Task Linked</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {selectedEmail ? (
            <>
              <div className="p-5 border-b border-gray-200 shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-[18px] font-semibold text-gray-900 leading-tight">{selectedEmail.subject}</h2>
                  <div className="flex gap-2 shrink-0">
                    <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors" title="Archive">
                      <Archive size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors" title="More">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar user={{ name: selectedEmail.from, color: '#2563eb' } as any} size={36} />
                    <div>
                      <div className="text-[13.5px] font-semibold text-gray-900">{selectedEmail.from}</div>
                      <div className="text-[12px] text-gray-500">to me • {selectedEmail.date} at {selectedEmail.time}</div>
                    </div>
                  </div>
                  
                  {!selectedEmail.taskLinked ? (
                    <button 
                      className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                      onClick={createTaskFromEmail}
                    >
                      <Plus size={14} /> Create Task
                    </button>
                  ) : (
                    <button className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 cursor-default">
                      <CheckCircle2 size={14} /> Task Created
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="text-[13.5px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.body}
                </div>
                
                {selectedEmail.attachments.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-gray-100">
                    <div className="text-[12px] font-semibold text-gray-500 mb-3">{selectedEmail.attachments.length} Attachments</div>
                    <div className="flex gap-3 flex-wrap">
                      {selectedEmail.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                            <Paperclip size={14} />
                          </div>
                          <div className="text-[12.5px] font-medium text-gray-700">{att}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-gray-50/50 shrink-0">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <textarea 
                    className="w-full p-3 text-[13.5px] outline-none resize-none min-h-[100px]"
                    placeholder="Reply to this email..."
                    value={draftReply}
                    onChange={e => setDraftReply(e.target.value)}
                  />
                  <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-100">
                    <button 
                      className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                      onClick={generateAIDraft}
                      disabled={isDrafting}
                    >
                      <Sparkles size={14} className={isDrafting ? 'animate-pulse' : ''} /> 
                      {isDrafting ? 'Drafting...' : 'Draft with AI'}
                    </button>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors"
                      onClick={sendReply}
                    >
                      <Send size={14} /> Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Mail size={48} className="mb-4 opacity-20" />
              <p className="text-[14px] font-medium text-gray-500">Select an email to read</p>
            </div>
          )}
        </div>
      </div>

      {isTaskModalOpen && selectedEmail && (
        <TaskModal
          task={{
            id: '',
            title: `Follow up: ${selectedEmail.subject}`,
            clientId: selectedEmail.clientId || '',
            type: 'Other',
            status: 'To Do',
            priority: 'Medium',
            assigneeId: 'u1',
            reviewerId: '',
            dueDate: fmt(today),
            createdAt: fmt(today),
            recurring: 'One-time',
            description: `From Email:\n\n${selectedEmail.body}`,
            tags: ['email'],
            subtasks: [],
            comments: [],
            attachments: [],
            activity: []
          }}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}
    </div>
  );
}
