import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Trophy, Building, CheckCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';

export const CoordinatorFormModal = ({ isOpen, coordinator = null, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'Coordinator',
    assignedSport: 'cricket',
    sportName: 'Cricket',
    college: 'MPEC',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (coordinator) {
      setFormData({
        id: coordinator.id,
        name: coordinator.name || '',
        username: coordinator.username || '',
        email: coordinator.email || '',
        phone: coordinator.phone || '',
        password: coordinator.password || '',
        role: coordinator.role || 'Coordinator',
        assignedSport: coordinator.assignedSport || 'cricket',
        sportName: coordinator.sportName || 'Cricket',
        college: coordinator.college || 'MPEC',
        status: coordinator.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'Coordinator',
        assignedSport: 'cricket',
        sportName: 'Cricket',
        college: 'MPEC',
        status: 'Active'
      });
    }
    setErrors({});
  }, [coordinator, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole) => {
    let newSport = formData.assignedSport;
    let newSportName = formData.sportName;

    if (newRole === 'Coordinator') {
      newSport = formData.assignedSport || 'cricket';
      const sObj = ALL_12_SPORTS.find(s => s.id === newSport) || ALL_12_SPORTS[0];
      newSportName = sObj.name;
    } else if (newRole === 'PR Member') {
      newSport = 'Media & PR';
      newSportName = 'Media & PR';
    } else {
      newSport = 'All Sports';
      newSportName = 'All Sports';
    }

    setFormData({
      ...formData,
      role: newRole,
      assignedSport: newSport,
      sportName: newSportName,
      college: newRole === 'Head Coordinator' ? (formData.college || 'MPEC') : ''
    });
  };

  const handleSportChange = (sportId) => {
    const sportObj = ALL_12_SPORTS.find(s => s.id === sportId) || { name: 'General Sports' };
    setFormData({
      ...formData,
      assignedSport: sportId,
      sportName: sportObj.name
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Phone number must be at least 10 digits';
    }
    if (!coordinator && !formData.password.trim()) {
      errs.password = 'Password is required for a new account';
    } else if (formData.password && formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      setErrors({ api: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-white">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {coordinator ? 'Edit Account' : 'Create Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure management permissions & profile parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="coordinator-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 custom-scrollbar">
          {/* Global Error Banner */}
          {errors.api && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              {errors.api}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Select Role */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Role *</label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold transition-colors"
              >
                <option value="Coordinator">Coordinator (12 Sports Coordinator)</option>
                <option value="Head Coordinator">Head Coordinator (College Head)</option>
                <option value="Super Coordinator">Super Coordinator (President / Event Host)</option>
                <option value="PR Member">PR Member (Media & PR)</option>
              </select>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vikramaditya Sharma"
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.name}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. coord_cricket"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {errors.username && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.username}</p>}
            </div>

            {/* Account Status */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="coordinator@apex.edu"
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Password {coordinator ? '' : '*'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={coordinator ? 'Leave blank to keep current' : 'e.g. Password@123'}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.password}</p>}
            </div>

            {/* DYNAMIC FIELD: Sport or College */}
            {formData.role === 'Coordinator' && (
              <div>
                <label className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Select Sport (12 Games) *</span>
                </label>
                <select
                  value={formData.assignedSport}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {ALL_12_SPORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.role === 'Head Coordinator' && (
              <div>
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mb-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>Select College (College Head) *</span>
                </label>
                <select
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {ALL_COLLEGES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(formData.role === 'PR Member' || formData.role === 'Super Coordinator') && (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center">
                ℹ️ {formData.role === 'PR Member' ? 'PR Members have global Media & PR coverage access.' : 'Super Coordinators have global fest administrative access.'}
              </div>
            )}
          </div>
        </form>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300/60 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="coordinator-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>{coordinator ? 'Update Account' : 'Save Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
