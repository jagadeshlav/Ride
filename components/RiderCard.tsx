
import React from 'react';
import { Rider, RiderStatus } from '../types';

interface RiderCardProps {
  rider: Rider;
}

const RiderCard: React.FC<RiderCardProps> = ({ rider }) => {
  const getStatusColor = (status: RiderStatus) => {
    switch (status) {
      case RiderStatus.RIDING: return 'bg-green-500';
      case RiderStatus.STOPPED: return 'bg-yellow-500';
      case RiderStatus.EMERGENCY: return 'bg-red-500 animate-pulse';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-colors">
      <div className="relative">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: rider.color }}
        >
          {rider.name.charAt(0)}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusColor(rider.status)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-slate-200 truncate">{rider.name} {rider.isMe && '(You)'}</h4>
          <span className="text-[10px] text-slate-400">{(rider.location.speed || 0).toFixed(0)} km/h</span>
        </div>
        <p className="text-[11px] text-slate-500 truncate">
          {rider.status === RiderStatus.RIDING ? 'In transit' : rider.status.toLowerCase()}
        </p>
      </div>
    </div>
  );
};

export default RiderCard;
