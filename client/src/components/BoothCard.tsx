import React from 'react';
import { Booth } from '../types/booth';
import { Activity, Battery, Thermometer, HardDrive, Signal, Camera } from 'lucide-react';

interface BoothCardProps {
  booth: Booth;
  onClick?: () => void;
}

export const BoothCard: React.FC<BoothCardProps> = ({ booth, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSignalBars = (signal: number) => {
    if (signal > -70) return 4;
    if (signal > -85) return 3;
    if (signal > -100) return 2;
    return 1;
  };

  const lastSeen = new Date(booth.last_seen);
  const timeSinceLastSeen = Math.floor(
    (Date.now() - lastSeen.getTime()) / 1000 / 60
  );

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4"
      style={{
        borderLeftColor:
          booth.status === 'online'
            ? '#10b981'
            : booth.status === 'offline'
            ? '#ef4444'
            : '#eab308',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{booth.name}</h3>
          <p className="text-sm text-gray-500">{booth.address}</p>
        </div>
        <div
          className={`${getStatusColor(
            booth.status
          )} w-3 h-3 rounded-full`}
        ></div>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        {booth.status === 'offline' ? (
          <p>Offline for {timeSinceLastSeen} minutes</p>
        ) : (
          <p>Last seen: {lastSeen.toLocaleTimeString()}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Battery size={16} className="text-orange-500" />
          <span className="text-sm">{booth.battery_level}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-red-500" />
          <span className="text-sm">{booth.temperature?.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive size={16} className="text-blue-500" />
          <span className="text-sm">{booth.storage_used_percent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Signal size={16} className="text-purple-500" />
          <span className="text-sm">{booth.signal_strength}dBm</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Camera size={14} />
            <span>{booth.photos_taken_total} photos</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Activity size={14} />
            <span>{booth.sessions_count} sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
