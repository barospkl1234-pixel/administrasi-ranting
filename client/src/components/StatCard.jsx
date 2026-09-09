import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'emerald', onClick }) {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-300',
      bar: 'bg-emerald-500'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-300',
      bar: 'bg-amber-500'
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-300',
      bar: 'bg-blue-500'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'hover:border-indigo-300',
      bar: 'bg-indigo-500'
    },
    teal: {
      bg: 'bg-teal-50 text-teal-600',
      border: 'hover:border-teal-300',
      bar: 'bg-teal-500'
    }
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm transition-all duration-200 hover:shadow-md ${style.border} ${onClick ? 'cursor-pointer' : ''} relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${style.bar}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h4 className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight">{value}</h4>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
              {subtext}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} shrink-0`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
}

