import React, { useEffect } from 'react';
import { Crown, User } from 'lucide-react';
import { InputField, SelectField, PlayerDetailsCard } from './SharedFormComponents';
import { collegeCourses } from '../../data/collegeCourses';

export const ChessRegistration = ({
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

  // Initialize roster with exactly 1 player
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

    setFormData((prev) => ({
      ...prev,
      roster: updatedRoster
    }));
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
            college: value,
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
      setErrors((prev) => ({ ...prev, errorKey: null }));
    }
  };

  if (step === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Chess Participant Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            placeholder="e.g. Magnus Carlsen"
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
              placeholder="e.g. magnus@college.edu"
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
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Chess Participant Profile
        </h2>

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
              teamCollege={formData.collegeName}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const validateChess = (step, formData) => {
  const errors = {};

  if (step === 2) {
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
