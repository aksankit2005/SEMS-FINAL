import React from 'react';
import { ToggleRight, ToggleLeft, Clock, Lock, AlertCircle, CheckCircle2, XCircle, Power, PowerOff } from 'lucide-react';
import { computeEffectiveRegistrationStatus } from '../../../utils/registrationLifecycle';

/**
 * Renders the standardized Event Operational Status Badge (Active / Inactive)
 */
export const EventStatusBadge = ({ event }) => {
  const isEventActive = (event?.status || '').toLowerCase() === 'published' || (event?.status || '').toLowerCase() === 'active';
  const isUpcoming = (event?.status || '').toLowerCase() === 'upcoming';

  let badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/40';
  let dotColor = 'bg-slate-400';
  let label = 'EVENT: INACTIVE';

  if (isEventActive) {
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    dotColor = 'bg-blue-400';
    label = 'EVENT: ACTIVE';
  } else if (isUpcoming) {
    badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    dotColor = 'bg-sky-400';
    label = 'EVENT: UPCOMING';
  }

  return (
    <span 
      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md flex items-center gap-1.5 ${badgeColor}`}
      title={`Event status: ${event?.status || 'Inactive'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isEventActive ? 'animate-pulse' : ''}`} />
      <span>{label}</span>
    </span>
  );
};

/**
 * Independent Event Status Action Button (Activate / Deactivate Event)
 */
export const EventStatusActionButton = ({ event, onToggleStatus }) => {
  const isEventActive = (event?.status || '').toLowerCase() === 'published' || (event?.status || '').toLowerCase() === 'active';

  if (isEventActive) {
    return (
      <button
        onClick={() => onToggleStatus && onToggleStatus(event, 'Inactive')}
        className="px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
        title="Deactivate this event (disables public views & participation)"
      >
        <PowerOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span>Deactivate Event</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => onToggleStatus && onToggleStatus(event, 'Active')}
      className="px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40"
      title="Activate this event to publish it on the platform"
    >
      <Power className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      <span>Activate Event</span>
    </button>
  );
};

/**
 * Renders the standardized Registration Badge
 */
export const RegistrationStatusBadge = ({ event }) => {
  const regStatus = computeEffectiveRegistrationStatus(event);

  let badgeColor = 'bg-slate-500/20 text-slate-300 border-slate-500/40';
  let dotColor = 'bg-slate-400';

  if (regStatus.code === 'OPEN') {
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    dotColor = 'bg-emerald-400';
  } else if (regStatus.code === 'CLOSED_MANUALLY') {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    dotColor = 'bg-amber-400';
  } else if (regStatus.code === 'CLOSED_DEADLINE_PASSED') {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    dotColor = 'bg-rose-400';
  } else if (regStatus.code === 'CLOSED_CAPACITY_FULL') {
    badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    dotColor = 'bg-purple-400';
  } else if (regStatus.code === 'UPCOMING') {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    dotColor = 'bg-amber-400';
  } else if (regStatus.code === 'NOT_STARTED') {
    badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    dotColor = 'bg-sky-400';
  }

  return (
    <span 
      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md flex items-center gap-1.5 ${badgeColor}`}
      title={regStatus.reason}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${regStatus.code === 'OPEN' ? 'animate-pulse' : ''}`} />
      <span>{regStatus.label}</span>
    </span>
  );
};

/**
 * Independent Registration Action Button (Open / Close Registration)
 */
export const RegistrationActionButton = ({ event, onToggle, onOpenEdit }) => {
  const regStatus = computeEffectiveRegistrationStatus(event);

  if (regStatus.code === 'OPEN') {
    return (
      <button
        onClick={() => onToggle(event)}
        className="px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
        title="Close registration to freeze participants and enable match scheduling"
      >
        <ToggleRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span>Close Reg (Enable Fixtures)</span>
      </button>
    );
  }

  if (regStatus.canReopen) {
    return (
      <button
        onClick={() => onToggle(event)}
        className="px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
        title="Reopen registration for new student signups (before deadline)"
      >
        <ToggleLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Reopen Registration</span>
      </button>
    );
  }

  if (regStatus.code === 'CLOSED_DEADLINE_PASSED') {
    return (
      <button
        onClick={() => onOpenEdit && onOpenEdit(event)}
        className="px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 cursor-pointer hover:bg-rose-500/20 transition"
        title="Registration deadline has passed. Click to edit/extend the registration end date."
      >
        <Clock className="w-3.5 h-3.5 text-rose-500" />
        <span>Closed (Deadline Passed) • Extend End Date</span>
      </button>
    );
  }

  return (
    <span 
      className="px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
      title={regStatus.reason}
    >
      <Lock className="w-3.5 h-3.5" />
      <span>{regStatus.label}</span>
    </span>
  );
};
