import React, { useEffect } from 'react';
import { User, Flame, Crown, Check, Users } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';
import { OFFICIAL_ATHLETICS_EVENTS } from './AthleticsRegistration';
import { resolveSportKey } from '../../data/sportsConfig';

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

  const isAthletics = resolveSportKey(sport) === 'athletics' || (sport?.id || '').toLowerCase().includes('athletics') || (sport?.sportId || '').toLowerCase().includes('athletics');
  const selectedEvent = (formData.selectedEvents && formData.selectedEvents[0]) || formData.subEvent || '';
  const isRelay = selectedEvent === '4*100m relay Race' || selectedEvent.toLowerCase().includes('relay');

  // Initialize roster size
  useEffect(() => {
    if (!isAthletics) {
      setFormData((prev) => {
        const currentRoster = prev.roster || [];
        if (currentRoster.length === 1) return prev;
        
        const firstPlayer = currentRoster[0] || {};
        return {
          ...prev,
          roster: [{
            name: firstPlayer.name || prev.captainName || '',
            rollNo: firstPlayer.rollNo || '',
            branch: firstPlayer.branch || '',
            semester: firstPlayer.semester || '',
            phone: firstPlayer.phone || prev.captainPhone || '',
            email: firstPlayer.email || prev.captainEmail || '',
            fatherName: firstPlayer.fatherName || '',
            dob: firstPlayer.dob || '',
            college: firstPlayer.college || prev.collegeName || '',
            gender: firstPlayer.gender || prev.gender || ''
          }]
        };
      });
      return;
    }

    // For Athletics: 4 players if Relay, 1 player if individual
    const requiredSize = isRelay ? 4 : 1;
    setFormData((prev) => {
      const currentRoster = prev.roster || [];
      if (currentRoster.length === requiredSize) return prev;

      let updatedRoster = [...currentRoster];
      if (updatedRoster.length < requiredSize) {
        while (updatedRoster.length < requiredSize) {
          const idx = updatedRoster.length;
          updatedRoster.push({
            name: idx === 0 ? (prev.captainName || '') : '',
            rollNo: '',
            branch: '',
            semester: '',
            phone: idx === 0 ? (prev.captainPhone || '') : '',
            email: idx === 0 ? (prev.captainEmail || '') : '',
            gender: ''
          });
        }
      } else {
        updatedRoster = updatedRoster.slice(0, requiredSize);
      }

      return {
        ...prev,
        roster: updatedRoster
      };
    });
  }, [sport.id, selectedEvent, isRelay, formData.roster?.length, setFormData]);

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
            college: value,
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

  // Strictly SINGLE event selection
  const handleSingleEventSelect = (eventName, fee) => {
    setFormData((prev) => ({
      ...prev,
      selectedEvents: [eventName],
      subEvent: eventName,
      athleticsEvent: eventName,
      entryFee: fee !== undefined ? fee : prev.entryFee
    }));

    if (errors.selectedEvents) {
      setErrors((prev) => ({ ...prev, selectedEvents: null }));
    }
  };

  const currentRoster = formData.roster || [];
  const requiredSize = (isAthletics && isRelay) ? 4 : 1;
  let effectiveRoster = [...currentRoster];
  if (effectiveRoster.length < requiredSize) {
    const needed = requiredSize - effectiveRoster.length;
    for (let i = 0; i < needed; i++) {
      const idx = effectiveRoster.length;
      effectiveRoster.push({
        name: idx === 0 ? (formData.captainName || '') : '',
        rollNo: '',
        branch: '',
        semester: '',
        phone: idx === 0 ? (formData.captainPhone || '') : '',
        email: idx === 0 ? (formData.captainEmail || '') : '',
        fatherName: '',
        dob: '',
        college: formData.collegeName || '',
        gender: formData.gender || ''
      });
    }
  }

  const handlePlayerChange = (index, field, value) => {
    setFormData((prev) => {
      const currentRoster = prev.roster || [];
      const updatedRoster = [...currentRoster];
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

      return {
        ...prev,
        ...syncUpdates,
        roster: updatedRoster
      };
    });

    const errorKey = `player_${index}_${field}`;
    setErrors((prev) => ({
      ...prev,
      [errorKey]: null,
      [`player_${index}_rollNo`]: null,
      [`player_${index}_lt`]: null
    }));
  };

  const availableCourses = collegeCourses[formData.collegeName] || [];

  // Resolve official athletics sub-events list with coordinator prices
  const athleticsSubEventsList = (
    (Array.isArray(sport.subEventsConfig) && sport.subEventsConfig.length > 0 && sport.subEventsConfig.filter((se) => se.enabled !== false)) ||
    (Array.isArray(sport.subEvents) && sport.subEvents.length > 0 && sport.subEvents) ||
    OFFICIAL_ATHLETICS_EVENTS
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Sport Title & Icon */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          {sport.id === 'chess' ? <Crown className="w-5 h-5" /> : isAthletics ? <Flame className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">{sport.name} Details</h2>
          <p className="text-xs text-slate-400 font-bold">
            {isAthletics
              ? (isRelay ? '4*100m Relay Team Registration (4 Members)' : 'Individual Athletics Game Registration (Choose 1 Game)')
              : 'Individual Athlete Profile Registration'}
          </p>
        </div>
      </div>

      {/* Athletics Single Event Selector */}
      {isAthletics && (
        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Athletics Sub-Event (Choose Exactly 1 Game) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              {athleticsSubEventsList.length} Track & Field Events Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {athleticsSubEventsList.map((item) => {
              const eventName = typeof item === 'string' ? item : (item.name || '');
              const isRelayEvt = eventName === '4*100m relay Race' || eventName.toLowerCase().includes('relay');
              const fee = sport.subEventFees?.[eventName] !== undefined
                ? Number(sport.subEventFees[eventName])
                : (typeof item === 'object' && item.entryFee !== undefined
                    ? Number(item.entryFee)
                    : (isRelayEvt ? 400 : (sport.entryFee || 150)));
              const isSelected = selectedEvent === eventName;

              return (
                <button
                  key={eventName}
                  type="button"
                  onClick={() => handleSingleEventSelect(eventName, fee)}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{eventName}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {isRelayEvt ? '4-Player Relay Squad' : 'Individual Competition'}
                    </p>
                  </div>

                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {fee === 0 ? 'FREE' : `₹${fee}`}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.selectedEvents && (
            <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.selectedEvents}</p>
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

      {/* Player details profile card(s) */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">
          {isAthletics && isRelay
            ? '2. 4*100m Relay Team Members (4 Players)'
            : '2. Participant Profile Details'}
        </h4>
        {effectiveRoster.map((player, idx) => (
          <PlayerDetailsCard
            key={idx}
            index={idx}
            player={player}
            onChange={handlePlayerChange}
            showRemove={false}
            errors={{
              name: errors[`player_${idx}_name`],
              rollNo: errors[`player_${idx}_rollNo`],
              lt: errors[`player_${idx}_lt`],
              section: errors[`player_${idx}_section`],
              branch: errors[`player_${idx}_branch`],
              semester: errors[`player_${idx}_semester`],
              phone: errors[`player_${idx}_phone`],
              email: errors[`player_${idx}_email`],
              gender: errors[`player_${idx}_gender`]
            }}
            availableCourses={availableCourses}
            teamCollege={formData.collegeName}
            isFirstPlayer={idx === 0}
            sameAsCaptain={false}
            onToggleSameAsCaptain={null}
          />
        ))}
      </div>
    </div>
  );
};


// Common individual validation
export const validateIndividualForm = (sport, formData) => {
  const errors = {};

  const isAthletics = resolveSportKey(sport) === 'athletics' || (sport?.id || '').toLowerCase().includes('athletics') || (sport?.sportId || '').toLowerCase().includes('athletics');
  if (isAthletics) {
    const selectedList = formData.selectedEvents || (formData.subEvent ? [formData.subEvent] : []);
    if (selectedList.length !== 1) {
      errors.selectedEvents = 'Please select exactly one Athletics sub-event';
    }
  }

  if (!formData.collegeName) {
    errors.collegeName = 'College Name is required';
  }

  const roster = formData.roster || [];
  if (roster.length === 0) {
    errors.rosterError = 'Participant Profile is missing';
    return errors;
  }

  roster.forEach((player, index) => {
    if (!player.name?.trim()) {
      errors[`player_${index}_name`] = 'Full Name is required';
    }
    if (!player.rollNo?.trim()) {
      errors[`player_${index}_rollNo`] = 'Roll Number is required';
    }
    if (!player.branch?.trim()) {
      errors[`player_${index}_branch`] = 'Course is required';
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

  return errors;
};
