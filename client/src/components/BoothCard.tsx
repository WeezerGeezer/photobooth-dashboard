import React from 'react';
import { Booth } from '../types/booth';
import { Activity, Battery, Thermometer, HardDrive, Signal, Camera, AlertTriangle } from 'lucide-react';

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
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border-l-4 hover:scale-105 overflow-hidden group"
      style={{
        borderLeftColor:
          booth.status === 'online'
            ? '#10b981'
            : booth.status === 'offline'
            ? '#ef4444'
            : '#eab308',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-800 truncate">{booth.name}</h3>
            <p className="text-sm text-gray-500 truncate">{booth.address}</p>
          </div>
          <div
            className={`${getStatusColor(
              booth.status
            )} w-3 h-3 rounded-full flex-shrink-0 ml-2 animate-pulse`}
          ></div>
        </div>

        <div className="text-xs text-gray-500 mb-3 font-medium">
          {booth.status === 'offline' ? (
            <p className="text-red-600">Offline for {timeSinceLastSeen} min</p>
          ) : (
            <p className="text-green-600">Last seen: {lastSeen.toLocaleTimeString()}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricItem
            icon={<Battery size={16} className="text-orange-500" />}
            value={`${booth.battery_level}%`}
            label="Battery"
            warning={booth.battery_level < 30}
          />
          <MetricItem
            icon={<Thermometer size={16} className="text-red-500" />}
            value={`${booth.temperature?.toFixed(1)}°C`}
            label="Temp"
          />
          <MetricItem
            icon={<HardDrive size={16} className="text-blue-500" />}
            value={`${booth.storage_used_percent}%`}
            label="Storage"
            warning={booth.storage_used_percent > 80}
          />
          <MetricItem
            icon={<Signal size={16} className="text-purple-500" />}
            value={`${booth.signal_strength}dBm`}
            label="Signal"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Camera size={14} />
              <span className="font-medium">{booth.photos_taken_total}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Activity size={14} />
              <span className="font-medium">{booth.sessions_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};

interface MetricItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  warning?: boolean;
}

function MetricItem({ icon, value, label, warning }: MetricItemProps) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded ${warning ? 'bg-red-50' : 'bg-gray-50'}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs text-gray-500 font-medium`}>{label}</p>
        <p className={`text-sm font-semibold ${warning ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      </div>
      {warning && <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />}
    </div>
  );
}
