import React, { useEffect } from 'react';
import { Users, Plus, ShieldAlert, Award } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const TeamDetailsForm = ({
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

  // Get constraints from sport
  const minPlayers = sport.minPlayers || 2;
  const maxPlayers = sport.maxPlayers || 2;

  // Initialize roster with the correct size if empty or incorrect
  useEffect(() => {
    const currentRoster = formData.roster || [];
    if (currentRoster.length < minPlayers) {
      const needed = minPlayers - currentRoster.length;
      const newPlayers = Array.from({ length: needed }, () => ({
        name: '',
        rollNo: '',
        branch: '',
        semester: '',
        phone: '',
        email: '',
        gender: ''
      }));
      setFormData((prev) => ({
        ...prev,
        roster: [...currentRoster, ...newPlayers]
      }));
    }
  }, [minPlayers, formData.roster, setFormData]);

  // Keep captain details in roster player #1 updated
  useEffect(() => {
    if (formData.sameAsCaptain !== false && formData.roster && formData.roster[0]) {
      const updatedRoster = [...formData.roster];
      let changed = false;
      if (formData.captainName && updatedRoster[0].name !== formData.captainName) {
        updatedRoster[0].name = formData.captainName;
        changed = true;
      }
      if (formData.captainPhone && updatedRoster[0].phone !== formData.captainPhone) {
        updatedRoster[0].phone = formData.captainPhone;
        changed = true;
      }
      if (formData.captainEmail && updatedRoster[0].email !== formData.captainEmail) {
        updatedRoster[0].email = formData.captainEmail;
        changed = true;
      }
      if (changed) {
        setFormData((prev) => ({ ...prev, roster: updatedRoster }));
      }
    }
  }, [formData.captainName, formData.captainPhone, formData.captainEmail, formData.roster, formData.sameAsCaptain, setFormData]);

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

  const handlePlayerChange = (index, field, value) => {
    const updatedRoster = [...formData.roster];
    updatedRoster[index] = {
      ...updatedRoster[index],
      [field]: value
    };

    // Keep top-level captain details synced if updating player #1 (and sameAsCaptain is active)
    const syncUpdates = {};
    if (index === 0 && formData.sameAsCaptain !== false) {
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

  const handleAddPlayer = () => {
    if (formData.roster.length >= maxPlayers) return;
    setFormData((prev) => ({
      ...prev,
      roster: [
        ...prev.roster,
        {
          name: '',
          rollNo: '',
          branch: '',
          semester: '',
          phone: '',
          email: '',
          gender: ''
        }
      ]
    }));
  };

  const handleRemovePlayer = (index) => {
    if (formData.roster.length <= minPlayers) return;
    const updatedRoster = formData.roster.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      roster: updatedRoster
    }));
    setErrors({});
  };

  const currentRosterSize = formData.roster ? formData.roster.length : 0;
  const availableCourses = collegeCourses[formData.collegeName] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sport Title & Icon */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">{sport.name} Details</h2>
          <p className="text-xs text-slate-400 font-bold">Team Squad & Captain Profile Registration</p>
        </div>
      </div>

      {/* Team Details Group */}
      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">1. Team & Captain Details</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <InputField
              label="Team Name"
              name="teamName"
              value={formData.teamName || ''}
              onChange={handleInputChange}
              placeholder="e.g. Mavericks FC"
              required
              error={errors.teamName}
            />
          </div>

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
            label="Captain Name"
            name="captainName"
            value={formData.captainName || ''}
            onChange={handleInputChange}
            placeholder="e.g. Rohit Sharma"
            required
            error={errors.captainName}
          />

          <InputField
            label="Captain Mobile Number"
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
              label="Captain Email Address"
              name="captainEmail"
              type="email"
              value={formData.captainEmail || ''}
              onChange={handleInputChange}
              placeholder="e.g. captain@college.edu"
              required
              error={errors.captainEmail}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Player roster card list */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">2. Roster Details</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Squad: {currentRosterSize} Athletes ({minPlayers} Active + {currentRosterSize - minPlayers} Subs)
            </p>
          </div>

          {currentRosterSize < maxPlayers && (
            <button
              type="button"
              onClick={handleAddPlayer}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Player (Max {maxPlayers})
            </button>
          )}
        </div>

        {currentRosterSize === maxPlayers && maxPlayers > minPlayers && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Maximum roster size of <strong>{maxPlayers}</strong> athletes reached.</span>
          </div>
        )}

        <div className="space-y-5">
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

              return (
                <PlayerDetailsCard
                  key={idx}
                  index={idx}
                  player={player}
                  onChange={handlePlayerChange}
                  onRemove={handleRemovePlayer}
                  showRemove={currentRosterSize > minPlayers}
                  errors={playerErrors}
                  availableCourses={availableCourses}
                  isFirstPlayer={idx === 0}
                  sameAsCaptain={formData.sameAsCaptain !== false}
                  onToggleSameAsCaptain={(val) => {
                    setFormData((prev) => {
                      const updatedRoster = [...prev.roster];
                      if (val && updatedRoster[0]) {
                        updatedRoster[0].name = prev.captainName || '';
                        updatedRoster[0].phone = prev.captainPhone || '';
                        updatedRoster[0].email = prev.captainEmail || '';
                      }
                      return {
                        ...prev,
                        sameAsCaptain: val,
                        roster: updatedRoster
                      };
                    });
                  }}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Team form validation
export const validateTeamForm = (sport, formData) => {
  const errors = {};

  const minPlayers = sport.minPlayers || 2;
  const maxPlayers = sport.maxPlayers || 2;

  if (!formData.teamName?.trim()) {
    errors.teamName = 'Team Name is required';
  }
  if (!formData.collegeName) {
    errors.collegeName = 'Please select a college';
  }
  if (!formData.captainName?.trim()) {
    errors.captainName = 'Captain Name is required';
  }

  // Captain Phone Validation
  const phone = formData.captainPhone?.trim();
  if (!phone) {
    errors.captainPhone = 'Captain Mobile Number is required';
  } else if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.captainPhone = 'Enter a valid 10-digit Indian mobile number';
  }

  // Captain Email Validation
  const email = formData.captainEmail?.trim();
  if (!email) {
    errors.captainEmail = 'Captain Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.captainEmail = 'Enter a valid email address';
  }

  const roster = formData.roster || [];
  if (roster.length < minPlayers) {
    errors.rosterError = `Minimum ${minPlayers} players required.`;
  }
  if (roster.length > maxPlayers) {
    errors.rosterError = `Maximum ${maxPlayers} players allowed.`;
  }

  roster.forEach((player, idx) => {
    if (!player.name?.trim()) {
      errors[`player_${idx}_name`] = 'Full Name is required';
    }
    if (!player.rollNo?.trim()) {
      errors[`player_${idx}_rollNo`] = 'Roll Number is required';
    }
    if (!player.branch?.trim()) {
      errors[`player_${idx}_branch`] = 'Course is required';
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

  return errors;
};
