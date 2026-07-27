import React from 'react';
import { User, Phone, Mail, Award, BookOpen, GraduationCap, X } from 'lucide-react';

export const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon,
  disabled = false
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs transition-all focus:outline-none focus:ring-2 ${
            Icon ? 'pl-10' : ''
          } ${
            disabled ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 font-semibold' : ''
          } ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
          }`}
        />
      </div>
      {error && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{error}</p>}
    </div>
  );
};

export const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  icon: Icon,
  disabled = false
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold transition-all focus:outline-none focus:ring-2 ${
            Icon ? 'pl-10' : ''
          } ${
            disabled ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40' : ''
          } ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900 bg-white dark:bg-slate-950">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{error}</p>}
    </div>
  );
};

export const PlayerDetailsCard = ({
  index,
  player,
  onChange,
  onRemove,
  showRemove = true,
  errors = {},
  availableCourses = [],
  isFirstPlayer = false,
  sameAsCaptain = false,
  onToggleSameAsCaptain = null
}) => {
  const semesters = [
    { value: '', label: 'Select Semester/Year' },
    { value: '1st Sem (1st Year)', label: '1st Semester (1st Year)' },
    { value: '2nd Sem (1st Year)', label: '2nd Semester (1st Year)' },
    { value: '3rd Sem (2nd Year)', label: '3rd Semester (2nd Year)' },
    { value: '4th Sem (2nd Year)', label: '4th Semester (2nd Year)' },
    { value: '5th Sem (3rd Year)', label: '5th Semester (3rd Year)' },
    { value: '6th Sem (3rd Year)', label: '6th Semester (3rd Year)' },
    { value: '7th Sem (4th Year)', label: '7th Semester (4th Year)' },
    { value: '8th Sem (4th Year)', label: '8th Semester (4th Year)' },
    { value: 'Intern', label: 'Intern' }
  ];

  const genders = [
    { value: '', label: 'Select Gender' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const handleChange = (field, val) => {
    onChange(index, field, val);
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in relative">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <User className="w-4 h-4" /> Player #{index + 1} Profile 
          {isFirstPlayer && (
            <span className="ml-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
              Captain / Lead
            </span>
          )}
        </h4>
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-900 transition"
            title="Remove Player"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isFirstPlayer && onToggleSameAsCaptain && (
        <div className="pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameAsCaptain}
              onChange={(e) => onToggleSameAsCaptain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Copy details from Captain / Lead Athlete
            </span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Full Name"
          value={player.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. John Doe"
          required
          error={errors.name}
          icon={User}
          disabled={isFirstPlayer && sameAsCaptain}
        />

        <InputField
          label="Roll / Student ID"
          value={player.rollNo}
          onChange={(e) => handleChange('rollNo', e.target.value)}
          placeholder="e.g. 23CS045"
          required
          error={errors.rollNo}
          icon={Award}
        />

        <SelectField
          label="Course"
          value={player.branch}
          onChange={(e) => handleChange('branch', e.target.value)}
          options={[
            { value: '', label: availableCourses.length > 0 ? 'Select Course' : 'Select College First' },
            ...availableCourses.map((c) => ({ value: c, label: c }))
          ]}
          required
          error={errors.branch}
          icon={BookOpen}
        />

        <SelectField
          label="Year / Semester"
          value={player.semester}
          onChange={(e) => handleChange('semester', e.target.value)}
          options={semesters}
          required
          error={errors.semester}
          icon={GraduationCap}
        />

        <InputField
          label="Mobile Number"
          type="tel"
          value={player.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="e.g. 9876543210"
          required
          error={errors.phone}
          icon={Phone}
          disabled={isFirstPlayer && sameAsCaptain}
        />

        <InputField
          label="Email Address"
          type="email"
          value={player.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="e.g. player@college.edu"
          required
          error={errors.email}
          icon={Mail}
          disabled={isFirstPlayer && sameAsCaptain}
        />

        <div className="sm:col-span-2">
          <SelectField
            label="Gender"
            value={player.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            options={genders}
            required
            error={errors.gender}
          />
        </div>
      </div>
    </div>
  );
};
