import React, { useEffect } from 'react';
import { Target, User, Users } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const BaseRacketRegistration = ({
  step,
  formData,
  setFormData,
  errors,
  setErrors,
  sportName
}) => {
  const colleges = [
    { value: '', label: 'Select College / University' },
    ...Object.keys(collegeCourses).map((c) => ({ value: c, label: c }))
  ];

  // Set default event selection to 'Singles' if not set
  useEffect(() => {
    if (!formData.eventType) {
      setFormData((prev) => ({
        ...prev,
        eventType: 'Singles'
      }));
    }
  }, [formData.eventType, setFormData]);

  // Adjust roster size whenever eventType changes
  useEffect(() => {
    const size = formData.eventType === 'Doubles' ? 2 : 1;
    const currentRoster = formData.roster || [];
    
    // Build roster array with captain details pre-populated on the first element if available
    let updatedRoster = [...currentRoster];
    if (updatedRoster.length < size) {
      const needed = size - updatedRoster.length;
      const newPlayers = Array.from({ length: needed }, () => ({
        name: '',
        rollNo: '',
        branch: '',
        semester: '',
        phone: '',
        email: '',
        gender: ''
      }));
      updatedRoster = [...updatedRoster, ...newPlayers];
    } else if (updatedRoster.length > size) {
      updatedRoster = updatedRoster.slice(0, size);
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

    setFormData((prev) => ({
      ...prev,
      roster: updatedRoster
    }));
  }, [formData.eventType, formData.captainName, formData.captainPhone, formData.captainEmail, setFormData]);

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

  const handleEventTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      eventType: type,
      // If switching back to Singles, clear teamName error or value
      teamName: type === 'Singles' ? '' : prev.teamName
    }));
    setErrors({});
  };

  const handlePlayerChange = (index, field, value) => {
    const updatedRoster = [...formData.roster];
    updatedRoster[index] = {
      ...updatedRoster[index],
      [field]: value
    };

    // If updating first player, sync with captain fields to maintain consistency
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
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" /> {sportName} Event & Contact Details
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Select Event Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleEventTypeChange('Singles')}
              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition ${
                formData.eventType === 'Singles'
                  ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              <User className="w-4 h-4" /> Singles (1 Player)
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('Doubles')}
              className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition ${
                formData.eventType === 'Doubles'
                  ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" /> Doubles (2 Players)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {formData.eventType === 'Doubles' && (
            <div className="sm:col-span-2">
              <InputField
                label="Team Name"
                name="teamName"
                value={formData.teamName || ''}
                onChange={handleInputChange}
                placeholder="e.g. Smashers Duo"
                required
                error={errors.teamName}
              />
            </div>
          )}

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
            label="Lead Player Name"
            name="captainName"
            value={formData.captainName || ''}
            onChange={handleInputChange}
            placeholder="e.g. Alice Smith"
            required
            error={errors.captainName}
          />

          <InputField
            label="Lead Player Mobile Number"
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
              label="Lead Player Email Address"
              name="captainEmail"
              type="email"
              value={formData.captainEmail || ''}
              onChange={handleInputChange}
              placeholder="e.g. lead@college.edu"
              required
              error={errors.captainEmail}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />{' '}
          {sportName} ({formData.eventType}) Participant Details
        </h2>

        <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
          {formData.roster &&
            formData.roster.map((player, idx) => {
              const playerErrors = {};
              const fields = ['name', 'rollNo', 'branch', 'semester', 'phone', 'email', 'gender'];
              fields.forEach((field) => {
                const key = `player_${idx}_${field}`;
                if (errors[key]) {
                  playerErrors[field] = errors[key];
                }
              });

              const availableCourses = collegeCourses[formData.collegeName] || [];

              return (
                <PlayerDetailsCard
                  key={idx}
                  index={idx}
                  player={player}
                  onChange={handlePlayerChange}
                  showRemove={false}
                  errors={playerErrors}
                  availableCourses={availableCourses}
                />
              );
            })}
        </div>
      </div>
    );
  }

  return null;
};

// Reusable validation function for racket sports
export const validateRacketSport = (step, formData) => {
  const errors = {};

  if (step === 2) {
    if (formData.eventType === 'Doubles' && !formData.teamName?.trim()) {
      errors.teamName = 'Team Name is required for Doubles event';
    }
    if (!formData.collegeName) {
      errors.collegeName = 'Please select a college';
    }
    if (!formData.captainName?.trim()) {
      errors.captainName = 'Lead Player Name is required';
    }

    // Captain Phone Validation
    const phone = formData.captainPhone?.trim();
    if (!phone) {
      errors.captainPhone = 'Lead Player Mobile Number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.captainPhone = 'Enter a valid 10-digit Indian mobile number';
    }

    // Captain Email Validation
    const email = formData.captainEmail?.trim();
    if (!email) {
      errors.captainEmail = 'Lead Player Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.captainEmail = 'Enter a valid email address';
    }
  }

  if (step === 3) {
    const roster = formData.roster || [];
    roster.forEach((player, idx) => {
      if (!player.name?.trim()) {
        errors[`player_${idx}_name`] = 'Full Name is required';
      }
      if (!player.rollNo?.trim()) {
        errors[`player_${idx}_rollNo`] = 'Roll Number is required';
      }
      if (!player.branch?.trim()) {
        errors[`player_${idx}_branch`] = 'Course/Branch is required';
      }
      if (!player.semester) {
        errors[`player_${idx}_semester`] = 'Semester is required';
      }

      const pPhone = player.phone?.trim();
      if (!pPhone) {
        errors[`player_${idx}_phone`] = 'Mobile Number is required';
      } else if (!/^[6-9]\d{9}$/.test(pPhone)) {
        errors[`player_${idx}_phone`] = 'Enter a valid 10-digit mobile number';
      }

      const pEmail = player.email?.trim();
      if (!pEmail) {
        errors[`player_${idx}_email`] = 'Email Address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pEmail)) {
        errors[`player_${idx}_email`] = 'Enter a valid email address';
      }

      if (!player.gender) {
        errors[`player_${idx}_gender`] = 'Gender is required';
      }
    });
  }

  return errors;
};
