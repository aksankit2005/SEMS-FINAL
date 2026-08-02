import React, { useEffect } from 'react';
import { User, Flame, Crown, Check } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const PlayerDetailsForm = ({
  sport,
  formData,
  setFormData,
  errors,
  setErrors
}) => {
  const colleges = [
    { value: '', label: 'Select College / University' },
    ...Object.keys(collegeCourses).map((c) => ({ value: c, label: c }))
  ];

  const athleticsEvents = [
    '100m',
    '200m',
    '400m',
    'Long Jump',
    'High Jump',
    'Javelin Throw',
    'Shot Put',
    'Discus Throw'
  ];

  // Initialize roster with exactly 1 player
  useEffect(() => {
    const currentRoster = formData.roster || [];
    let updatedRoster = [...currentRoster];

    if (updatedRoster.length !== 1) {
      updatedRoster = [{
        name: '',
        rollNo: '',
        branch: '',
        semester: '',
        phone: '',
        email: '',
        gender: ''
      }];
    }

    if (sport.id === 'athletics' && !formData.selectedEvents) {
      setFormData((prev) => ({
        ...prev,
        roster: updatedRoster,
        selectedEvents: []
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        roster: updatedRoster
      }));
    }
  }, [setFormData, sport.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };
      if (name === 'collegeName') {
        if (prev.roster) {
          updated.roster = prev.roster.map((player) => ({
            ...player,
            branch: '' // clear course selection
          }));
        }
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEventToggle = (eventName) => {
    const currentSelected = formData.selectedEvents || [];
    let updated;
    if (currentSelected.includes(eventName)) {
      updated = currentSelected.filter((e) => e !== eventName);
    } else {
      updated = [...currentSelected, eventName];
    }

    setFormData((prev) => ({
      ...prev,
      selectedEvents: updated
    }));

    if (errors.selectedEvents) {
      setErrors((prev) => ({ ...prev, selectedEvents: null }));
    }
  };

  const handlePlayerChange = (index, field, value) => {
    const updatedRoster = [...formData.roster];
    updatedRoster[index] = {
      ...updatedRoster[index],
      [field]: value
    };

    // Always sync for Singles so receipt gets the athlete's credentials
    const syncUpdates = {};
    if (index === 0) {
      if (field === 'name') syncUpdates.captainName = value;
      if (field === 'phone') syncUpdates.captainPhone = value;
      if (field === 'email') syncUpdates.captainEmail = value;
    }

    setFormData((prev) => ({
      ...prev,
      ...syncUpdates,
      roster: updatedRoster
    }));

    const errorKey = `player_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  const availableCourses = collegeCourses[formData.collegeName] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sport Title & Icon */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          {sport.id === 'chess' ? <Crown className="w-5 h-5" /> : sport.id === 'athletics' ? <Flame className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">{sport.name} Details</h2>
          <p className="text-xs text-slate-400 font-bold">Individual Athlete Profile Registration</p>
        </div>
      </div>

      {/* Athletics event checklist */}
      {sport.id === 'athletics' && (
        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1">
            Select Track & Field Events <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {athleticsEvents.map((evt) => {
              const isSelected = (formData.selectedEvents || []).includes(evt);
              return (
                <button
                  key={evt}
                  type="button"
                  onClick={() => handleEventToggle(evt)}
                  className={`p-3 rounded-xl border flex items-center gap-2 font-bold text-xs transition duration-200 text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{evt}</span>
                </button>
              );
            })}
          </div>
          {errors.selectedEvents && (
            <p className="text-[11px] text-rose-500 font-semibold">{errors.selectedEvents}</p>
          )}
        </div>
      )}

      {/* College Dropdown in details step */}
      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">1. College / Institution Selection</h4>
        <SelectField
          label="Select College / University"
          name="collegeName"
          value={formData.collegeName || ''}
          onChange={handleInputChange}
          options={colleges}
          required
          error={errors.collegeName}
        />
      </div>

      {/* Player details profile card */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">2. Participant Profile Details</h4>
        {formData.roster && formData.roster[0] && (
          <PlayerDetailsCard
            index={0}
            player={formData.roster[0]}
            onChange={handlePlayerChange}
            showRemove={false}
            errors={{
              name: errors.player_0_name,
              rollNo: errors.player_0_rollNo,
              branch: errors.player_0_branch,
              semester: errors.player_0_semester,
              phone: errors.player_0_phone,
              email: errors.player_0_email,
              gender: errors.player_0_gender
            }}
            availableCourses={availableCourses}
            isFirstPlayer={false}
            sameAsCaptain={false}
            onToggleSameAsCaptain={null}
          />
        )}
      </div>
    </div>
  );
};

// Common individual validation
export const validateIndividualForm = (sport, formData) => {
  const errors = {};

  // Check Athletics Event selection
  if (sport.id === 'athletics') {
    const selectedList = formData.selectedEvents || [];
    if (selectedList.length === 0) {
      errors.selectedEvents = 'Please select at least one Athletics event';
    }
  }

  if (!formData.collegeName) {
    errors.collegeName = 'College Name is required';
  }

  const roster = formData.roster || [];
  const player = roster[0];
  if (player) {
    if (!player.name?.trim()) {
      errors.player_0_name = 'Full Name is required';
    }
    if (!player.rollNo?.trim()) {
      errors.player_0_rollNo = 'Roll Number is required';
    }
    if (!player.branch?.trim()) {
      errors.player_0_branch = 'Course is required';
    }
    if (!player.semester) {
      errors.player_0_semester = 'Semester/Year is required';
    }

    const pPhone = player.phone?.trim();
    if (!pPhone) {
      errors.player_0_phone = 'Mobile Number is required';
    } else if (!/^[6-9]\d{9}$/.test(pPhone)) {
      errors.player_0_phone = 'Enter a valid 10-digit mobile number';
    }

    const pEmail = player.email?.trim();
    if (!pEmail) {
      errors.player_0_email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pEmail)) {
      errors.player_0_email = 'Enter a valid email address';
    }

    if (!player.gender) {
      errors.player_0_gender = 'Gender is required';
    }
  } else {
    errors.rosterError = 'Participant Profile is missing';
  }

  return errors;
};
