import React, { useEffect } from 'react';
import { Flame, Check, User, Users } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const OFFICIAL_ATHLETICS_EVENTS = [
  '100m Race',
  '200m Race',
  '4*100m relay Race',
  'Long Jump',
  'Javelin Throw',
  'Shot Put',
  'Discus Throw'
];

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

  const selectedEvent = (formData.selectedEvents && formData.selectedEvents[0]) || '';
  const isRelay = selectedEvent === '4*100m relay Race';

  // Ensure roster size matches selected event (4 for Relay, 1 for Individual)
  useEffect(() => {
    const requiredSize = isRelay ? 4 : 1;
    const currentRoster = formData.roster || [];
    let updatedRoster = [...currentRoster];

    if (updatedRoster.length !== requiredSize) {
      if (updatedRoster.length < requiredSize) {
        while (updatedRoster.length < requiredSize) {
          const idx = updatedRoster.length;
          updatedRoster.push({
            name: idx === 0 ? (formData.captainName || '') : '',
            rollNo: '',
            branch: '',
            semester: '',
            phone: idx === 0 ? (formData.captainPhone || '') : '',
            email: idx === 0 ? (formData.captainEmail || '') : '',
            gender: ''
          });
        }
      } else {
        updatedRoster = updatedRoster.slice(0, requiredSize);
      }
    }

    // Sync first player with captain details
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
  }, [selectedEvent, isRelay, formData.captainName, formData.captainPhone, formData.captainEmail, setFormData]);

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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Strictly single event selection
  const handleSingleEventSelect = (eventName) => {
    setFormData((prev) => ({
      ...prev,
      selectedEvents: [eventName]
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

  if (step === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Athletics Event & Participant Details
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Select Athletics Sub-Event (Choose Exactly 1 Game) <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {OFFICIAL_ATHLETICS_EVENTS.map((evt) => {
              const isSelected = selectedEvent === evt;
              const isRelayEvt = evt === '4*100m relay Race';
              return (
                <button
                  key={evt}
                  type="button"
                  onClick={() => handleSingleEventSelect(evt)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between font-bold text-xs transition duration-200 text-left cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{evt}</span>
                  </div>

                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isRelayEvt ? '4 Players Team' : 'Individual'}
                  </span>
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
            label={isRelay ? 'Relay Team Captain Name' : 'Participant Name'}
            name="captainName"
            value={formData.captainName || ''}
            onChange={handleInputChange}
            placeholder={isRelay ? 'e.g. Captain Name' : 'e.g. Athlete Name'}
            required
            error={errors.captainName}
          />

          <InputField
            label="Mobile Number"
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
              label="Email Address"
              name="captainEmail"
              type="email"
              value={formData.captainEmail || ''}
              onChange={handleInputChange}
              placeholder="e.g. athlete@college.edu"
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
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {isRelay ? <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            {isRelay ? '4*100m Relay Team Roster (4 Members)' : 'Athletics Participant Profile'}
          </h2>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Chosen Sub-Event:</span>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-black">
              {selectedEvent || 'None Selected'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {(formData.roster || []).map((player, index) => (
            <PlayerDetailsCard
              key={index}
              index={index}
              player={player}
              onChange={handlePlayerChange}
              showRemove={false}
              errors={{
                name: errors[`player_${index}_name`],
                rollNo: errors[`player_${index}_rollNo`],
                branch: errors[`player_${index}_branch`],
                semester: errors[`player_${index}_semester`],
                phone: errors[`player_${index}_phone`],
                email: errors[`player_${index}_email`],
                gender: errors[`player_${index}_gender`]
              }}
              availableCourses={collegeCourses[formData.collegeName] || []}
            />
          ))}
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
    if (selectedList.length !== 1) {
      errors.selectedEvents = 'Please select exactly one Athletics sub-event';
    }
    if (!formData.collegeName) {
      errors.collegeName = 'Please select a college';
    }
    if (!formData.captainName?.trim()) {
      errors.captainName = 'Participant / Captain Name is required';
    }

    const phone = formData.captainPhone?.trim();
    if (!phone) {
      errors.captainPhone = 'Mobile Number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.captainPhone = 'Enter a valid 10-digit Indian mobile number';
    }

    const email = formData.captainEmail?.trim();
    if (!email) {
      errors.captainEmail = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.captainEmail = 'Enter a valid email address';
    }
  }

  if (step === 3) {
    const roster = formData.roster || [];
    roster.forEach((player, index) => {
      if (!player.name?.trim()) {
        errors[`player_${index}_name`] = 'Full Name is required';
      }
      if (!player.rollNo?.trim()) {
        errors[`player_${index}_rollNo`] = 'Roll Number is required';
      }
      if (!player.branch?.trim()) {
        errors[`player_${index}_branch`] = 'Course/Branch is required';
      }
      if (!player.semester) {
        errors[`player_${index}_semester`] = 'Semester/Year is required';
      }

      const pPhone = player.phone?.trim();
      if (!pPhone) {
        errors[`player_${index}_phone`] = 'Mobile Number is required';
      } else if (!/^[6-9]\d{9}$/.test(pPhone)) {
        errors[`player_${index}_phone`] = 'Enter a valid 10-digit mobile number';
      }

      const pEmail = player.email?.trim();
      if (!pEmail) {
        errors[`player_${index}_email`] = 'Email Address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pEmail)) {
        errors[`player_${index}_email`] = 'Enter a valid email address';
      }

      if (!player.gender) {
        errors[`player_${index}_gender`] = 'Gender is required';
      }
    });
  }

  return errors;
};
