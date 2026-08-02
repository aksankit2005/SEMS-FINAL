import React, { useState } from 'react';
import { Users, Mail, Phone, MapPin, Send, MessageSquare, X } from 'lucide-react';
import { COORDINATORS_DATA } from '../data/coordinatorsData';
import { useToast } from '../context/ToastContext';

export const CoordinatorsPage = () => {
  const { addToast } = useToast();
  const [activeMessageModal, setActiveMessageModal] = useState(null);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText) {
      addToast('Please type a message', 'error');
      return;
    }
    addToast(`Message dispatched to ${activeMessageModal.name}`, 'success');
    setMessageText('');
    setActiveMessageModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Users className="w-4 h-4 text-orange-500" /> APEX Organizing Directory
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Tournament <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Coordinators</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Meet our dedicated sports faculty directors, arena referees, and student secretaries. Reach out for any event query.
          </p>
        </div>

        {/* Grid */}
        {COORDINATORS_DATA.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Coordinators Listed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tournament coordinator details have not been published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {COORDINATORS_DATA.map((coord) => (
              <div
                key={coord.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition flex flex-col justify-between"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={coord.photo}
                    alt={coord.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase tracking-wide">
                      {coord.role}
                    </span>
                    <h3 className="text-xl font-black mt-1 leading-tight">{coord.name}</h3>
                    <p className="text-xs text-slate-300">{coord.department}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Sports & Responsibilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {coord.sportsHandled.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate">{coord.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{coord.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{coord.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMessageModal(coord)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Direct Inquiry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Message Modal */}
      {activeMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">Send Query to {activeMessageModal.name}</h3>
              <button onClick={() => setActiveMessageModal(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Your Message</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your inquiry..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
