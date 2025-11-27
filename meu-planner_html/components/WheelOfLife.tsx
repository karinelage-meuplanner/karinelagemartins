import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { WheelSegment } from '../types';

interface Props {
  data: WheelSegment[];
  onUpdate: (index: number, value: number) => void;
}

export const WheelOfLife: React.FC<Props> = ({ data, onUpdate }) => {
  return (
    <div className="w-full h-96 bg-white/50 rounded-xl p-4 shadow-sm border border-stone-200">
      <h3 className="text-xl font-serif text-ink mb-4 text-center">Roda da Vida</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="label" tick={{ fill: '#4A4036', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="Vida"
            dataKey="value"
            stroke="#D98E73"
            fill="#D98E73"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {data.map((item, index) => (
            <div key={item.label} className="flex flex-col items-center">
                <label className="text-xs font-medium mb-1">{item.label}</label>
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={item.value} 
                    onChange={(e) => onUpdate(index, parseInt(e.target.value))}
                    className="w-full accent-accent h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-stone-500">{item.value}/10</span>
            </div>
        ))}
      </div>
    </div>
  );
};