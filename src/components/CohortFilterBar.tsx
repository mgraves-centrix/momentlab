import React from 'react';
import { Filter } from 'lucide-react';

interface CohortFilterBarProps {
  activeCohort: string;
  onSelectCohort: (cohort: string) => void;
}

export const CohortFilterBar: React.FC<CohortFilterBarProps> = ({ activeCohort, onSelectCohort }) => {
  const cohorts = [
    { id: 'ALL', label: 'All Demographics' },
    { id: '18-24', label: 'Age 18 - 24' },
    { id: '25-34', label: 'Age 25 - 34' }
  ];

  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-300">
      <div className="flex items-center gap-2 font-medium text-slate-200">
        <Filter size={16} className="text-cyan-400" />
        <span>Cohort Filter:</span>
      </div>
      <div className="flex items-center gap-2">
        {cohorts.map((cohort) => (
          <button
            key={cohort.id}
            onClick={() => onSelectCohort(cohort.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeCohort === cohort.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {cohort.label}
          </button>
        ))}
      </div>
    </div>
  );
};
