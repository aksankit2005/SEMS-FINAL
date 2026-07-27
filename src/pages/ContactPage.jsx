import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ContactPage = () => {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Query');
  const [message, setMessage] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      addToast('Please complete all required fields', 'error');
      return;
    }
    addToast('Your message has been sent to the APEX Help Desk!', 'success');
    setName('');
    setEmail('');
    setMessage('');
  };

  const faqs = [
    { q: "How can I register my college team for team sports?", a: "Navigate to the Registration page, choose your sport discipline, select your college, and add your player roster names." },
    { q: "What is the fee payment procedure?", a: "Fees can be paid online via simulated UPI/NetBanking or verified through your college sports director." },
    { q: "Can an athlete participate in multiple sports?", a: "Yes, provided match schedules do not clash. Please inspect the Schedule tab prior to registering." },
    { q: "Where do we collect physical ID badges?", a: "Physical ID passes are distributed at the Main Sports Office Complex 1 hour prior to opening ceremonies." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Mail className="w-4 h-4 text-orange-500" /> 24/7 Help Desk & Support
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Get In <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Have questions regarding tournament guidelines, entry fees, or accommodation? Contact our sports directorate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          
          {/* Contact Cards */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Email Support</h3>
                <p className="text-xs text-slate-500">support.apex2026@university.edu</p>
                <p className="text-xs text-slate-500">desk.sports@apex.edu</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Helpline Desk</h3>
                <p className="text-xs text-slate-500">+91 98765 43210 (General)</p>
                <p className="text-xs text-slate-500">+91 98765 00911 (Emergency First Aid)</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Sports Complex</h3>
                <p className="text-xs text-slate-500">Central Indoor Arena, Block A</p>
                <p className="text-xs text-slate-500">University Campus Road, India</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft">
            <h3 className="text-2xl font-black mb-6">Send Direct Inquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@college.edu"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Inquiry Topic</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General Query" className="text-slate-900 bg-white dark:bg-slate-950">General Query</option>
                  <option value="Registration Issue" className="text-slate-900 bg-white dark:bg-slate-950">Registration & Payment Issue</option>
                  <option value="Schedule Inquiry" className="text-slate-900 bg-white dark:bg-slate-950">Schedule Clashes & Fixtures</option>
                  <option value="Accommodation" className="text-slate-900 bg-white dark:bg-slate-950">Hostel & Accommodation Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Message Detail *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry..."
                  className="w-full p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Inquiry
              </button>
            </form>
          </div>

        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" /> Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm flex justify-between items-center bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-4 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
