import React, { useEffect } from 'react';
import { Users, Plus, ShieldAlert } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const BaseTeamRegistration = ({
  step,
  formData,
  setFormData,
  errors,
  setErrors,
  sportName,
  minPlayers,
  maxPlayers
}) => {
  const colleges = [
    { value: '', label: 'Select College / University' },
    ...Object.keys(collegeCourses).map((c) => ({ value: c, label: c }))
  ];

  // Initialize roster with the correct size if empty or incorrect
  useEffect(() => {
    if (!formData.roster || formData.roster.length < minPlayers) {
      const currentRoster = formData.roster || [];
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
    // Clear validation error when user types
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
    setFormData((prev) => ({
      ...prev,
      roster: updatedRoster
    }));

    // Clear roster validation error for this player & field if present
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
    // Re-index validation errors if they exist (cleaner to clear errors on remove)
    setErrors({});
  };

  if (step === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> {sportName} Team & Captain Details
        </h2>

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
            label="Captain / Lead Athlete Name"
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
    );
  }

  if (step === 3) {
    const currentRosterSize = formData.roster ? formData.roster.length : 0;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> {sportName} Player Roster
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Currently: {currentRosterSize} Athletes ({minPlayers} Active + {currentRosterSize - minPlayers} Subs)
            </p>
          </div>

          {currentRosterSize < maxPlayers && (
            <button
              type="button"
              onClick={handleAddPlayer}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs flex items-center gap-1.5 transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" /> Add Sub Player (Max {maxPlayers})
            </button>
          )}
        </div>

        {currentRosterSize === maxPlayers && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Maximum roster size of <strong>{maxPlayers}</strong> players reached.</span>
          </div>
        )}

        <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
          {formData.roster &&
            formData.roster.map((player, idx) => {
              const playerErrors = {};
              // Gather errors specific to this player
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
                  onRemove={handleRemovePlayer}
                  showRemove={currentRosterSize > minPlayers}
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

// Reusable validation function for team sports
export const validateTeamSport = (step, formData, minPlayers, maxPlayers) => {
  const errors = {};

  if (step === 2) {
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
  }

  if (step === 3) {
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
