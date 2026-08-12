import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, Mail, Phone } from 'lucide-react';

export const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Registration & Eligibility',
      question: 'Who is eligible to participate in APEX 2026 Sports Tournament?',
      answer: 'Students currently enrolled in undergraduate or postgraduate programs at recognized colleges and universities are eligible. A valid college ID card and authorization letter from the sports department are required at reporting.'
    },
    {
      category: 'Registration & Eligibility',
      question: 'How do I register my college team for team sports?',
      answer: 'Team registrations must be submitted by the designated college Sports Officer or Team Manager via the Online Registration page. You will need athlete names, student roll numbers, and official contact details.'
    },
    {
      category: 'Fixtures & Matches',
      question: 'Where can I find match schedules and live scores?',
      answer: 'All updated match fixtures, venue assignments, and real-time score updates are published on the Tournament Fixtures and Live Scores pages in real time.'
    },
    {
      category: 'Fixtures & Matches',
      question: 'What happens if a match is delayed due to weather conditions?',
      answer: 'Any schedule changes or weather postponements are instantly broadcast via the News & Announcements feed and updated on the live match ticker.'
    },
    {
      category: 'Certificates & Medals',
      question: 'When will digital certificates and medals be awarded?',
      answer: 'Winners, runners-up, and participating athletes receive official e-certificates directly downloadable from the Athlete Portal following the closing ceremony.'
    },
    {
      category: 'Support & Helpdesk',
      question: 'Who do I contact in case of an on-field dispute or emergency?',
      answer: 'Each sports venue has dedicated event coordinators and medical desks. You can also reach out via email at sports@mpgi.edu.in or call +91 91197 05860.'
    }
  ];

  const categories = ['All', 'Registration & Eligibility', 'Fixtures & Matches', 'Certificates & Medals', 'Support & Helpdesk'];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider border border-cyan-500/20">
            <HelpCircle className="w-4 h-4 text-cyan-500" /> Frequently Asked Questions
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            How can we <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">help you?</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Find answers to common questions about APEX 2026 sports registration, rules, live scoring, and tournament logistics.
          </p>

          {/* Search input */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-md"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No questions found matching your search.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm hover:border-cyan-500/40 transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-xs sm:text-base"
                  >
                    <span className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <span className="text-cyan-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 shrink-0 self-start sm:self-auto">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Helpbox */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-extrabold">Still have questions?</h3>
            <p className="text-xs text-slate-400 mt-1">Our organizing desk is available to assist team managers and athletes.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="mailto:sports@mpgi.edu.in"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <Mail className="w-4 h-4" /> Email Us
            </a>
            <a
              href="tel:+919119705860"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition border border-slate-700"
            >
              <Phone className="w-4 h-4" /> Call Desk
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
