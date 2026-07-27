import React, { useEffect } from 'react';
import { Flame, Check, User } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const AthleticsRegistration = ({
  step,
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
    '100m Race',
    '200m Race',
    '400m Race',
    'Long Jump',
    'High Jump',
    'Javelin Throw',
    'Shot Put',
    'Discus Throw'
  ];

  // Initialize roster with exactly 1 player and selectedEvents if empty
  useEffect(() => {
    const currentRoster = formData.roster || [];
    let updatedRoster = [...currentRoster];
    
    if (updatedRoster.length !== 1) {
      updatedRoster = [{
        name: formData.captainName || '',
        rollNo: '',
        branch: '',
        semester: '',
        phone: formData.captainPhone || '',
        email: formData.captainEmail || '',
        gender: ''
      }];
    }

    // Sync first player with captain details if captain details are entered
    if (updatedRoster[0]) {
      if (formData.captainName && !updatedRoster[0].name) {
        updatedRoster[0].name = formData.captainName;
      }
      if (formData.captainPhone && !updatedRoster[0].phone) {
        updatedRoster[0].phone = formData.captainPhone;
      }
      if (formData.captainEmail && !updatedRoster[0].email) {
        updatedRoster[0].email = formData.captainEmail;
      }
    }

    if (!formData.selectedEvents) {
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
  }, [formData.captainName, formData.captainPhone, formData.captainEmail, setFormData]);

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
            branch: ''
          }));
        }
      }
      return updated;
    });
    // Clear validation error
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

    // Sync with captain fields to maintain consistency
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

    // Clear validation error
    const errorKey = `player_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  if (step === 2) {
    const selectedList = formData.selectedEvents || [];
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Athletics Event & Participant Details
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Select Track & Field Events <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {athleticsEvents.map((evt) => {
              const isSelected = selectedList.includes(evt);
              return (
                <button
                  key={evt}
                  type="button"
                  onClick={() => handleEventToggle(evt)}
                  className={`p-3 rounded-xl border flex items-center gap-2 font-bold text-xs transition duration-200 text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
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
            <p className="text-[11px] text-rose-500 mt-2 font-semibold">{errors.selectedEvents}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="sm:col-span-2">
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

          <InputField
            label="Participant Name"
            name="captainName"
            value={formData.captainName || ''}
            onChange={handleInputChange}
            placeholder="e.g. Usain Bolt"
            required
            error={errors.captainName}
          />

          <InputField
            label="Participant Mobile Number"
            name="captainPhone"
            type="tel"
            value={formData.captainPhone || ''}
            onChange={handleInputChange}
            placeholder="e.g. 9876543210"
            required
            error={errors.captainPhone}
          />

          <div className="sm:col-span-2">
            <InputField
              label="Participant Email Address"
              name="captainEmail"
              type="email"
              value={formData.captainEmail || ''}
              onChange={handleInputChange}
              placeholder="e.g. bolt@college.edu"
              required
              error={errors.captainEmail}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const selectedList = formData.selectedEvents || [];
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Athletics Participant Profile
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Events Selected:</span>
            {selectedList.map((evt) => (
              <span key={evt} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {evt}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-6">
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
              availableCourses={collegeCourses[formData.collegeName] || []}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const validateAthletics = (step, formData) => {
  const errors = {};

  if (step === 2) {
    const selectedList = formData.selectedEvents || [];
    if (selectedList.length === 0) {
      errors.selectedEvents = 'Please select at least one athletics event';
    }
    if (!formData.collegeName) {
      errors.collegeName = 'Please select a college';
    }
    if (!formData.captainName?.trim()) {
      errors.captainName = 'Participant Name is required';
    }

    // Phone Validation
    const phone = formData.captainPhone?.trim();
    if (!phone) {
      errors.captainPhone = 'Participant Mobile Number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.captainPhone = 'Enter a valid 10-digit Indian mobile number';
    }

    // Email Validation
    const email = formData.captainEmail?.trim();
    if (!email) {
      errors.captainEmail = 'Participant Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.captainEmail = 'Enter a valid email address';
    }
  }

  if (step === 3) {
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
        errors.player_0_branch = 'Course/Branch is required';
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
    }
  }

  return errors;
};
