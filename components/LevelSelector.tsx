import React from 'react';
import { EducationLevel } from '../types';
import { GraduationCap, Baby, BookOpen, School, University } from 'lucide-react';

interface LevelSelectorProps {
  selectedLevel: EducationLevel;
  onSelect: (level: EducationLevel) => void;
}

const levels = [
  { value: EducationLevel.Preschool, icon: Baby, label: "Preschool", desc: "Simple & Fun" },
  { value: EducationLevel.Elementary, icon: BookOpen, label: "Elementary", desc: "Basics" },
  { value: EducationLevel.Middle, icon: School, label: "Middle School", desc: "Foundations" },
  { value: EducationLevel.High, icon: School, label: "High School", desc: "Detailed" },
  { value: EducationLevel.Undergrad, icon: University, label: "Undergrad", desc: "Academic" },
  { value: EducationLevel.Masters, icon: GraduationCap, label: "Master's+", desc: "Expert" },
];

export const LevelSelector: React.FC<LevelSelectorProps> = ({ selectedLevel, onSelect }) => {
  return (
    <div className="w-full py-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Select Your Education Level</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {levels.map((lvl) => {
          const Icon = lvl.icon;
          const isSelected = selectedLevel === lvl.value;
          return (
            <button
              key={lvl.value}
              onClick={() => onSelect(lvl.value)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-105' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50'}
              `}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="font-medium text-sm">{lvl.label}</span>
              <span className="text-xs opacity-75">{lvl.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
