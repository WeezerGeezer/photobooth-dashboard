import React from 'react';
import { useBooth } from '../hooks/useBooths';
import {
  Battery,
  Thermometer,
  HardDrive,
  Signal,
  Camera,
  Activity,
  AlertCircle,
  ArrowLeft,
  Wifi,
  WifiOff,
  Cpu,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BoothDetailProps {
  boothId: string | undefined;
  onBack?: () => void;
}

export const BoothDetail: React.FC<BoothDetailProps> = ({ boothId, onBack }) => {
  const { booth, loading, error } = useBooth(boothId);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading booth details...</p>
        </div>
      </div>
    );
  }

  if (error || !booth) {
    return (
      <div className="w-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={20} />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">
                  {error || 'Booth not found'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'maintenance':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100';
      case 'offline':
        return 'bg-red-100';
      case 'maintenance':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Transform health check data for charts
  const chartData = (booth.recent_health_checks || [])
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .slice(-24)
    .map((hc) => ({
      time: new Date(hc.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      battery: hc.battery_level,
      temperature: parseFloat(hc.temperature.toFixed(1)),
      storage: hc.storage_used_percent,
      signal: Math.abs(hc.signal_strength),
    }));

  return (
    <div className="w-full flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-8 py-6">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{booth.name}</h1>
              <p className="text-gray-600 mt-1">{booth.address}</p>
            </div>
            <div
              className={`${getStatusBg(booth.status)} px-4 py-2 rounded-lg border-2 ${
                booth.status === 'online' ? 'border-green-300' : 'border-red-300'
              }`}
            >
              <p
                className={`font-semibold ${getStatusColor(
                  booth.status
                )} flex items-center gap-2`}
              >
                {booth.status === 'online' ? (
                  <>
                    <Wifi size={20} />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff size={20} />
                    Offline
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-8">
          {/* Current Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Current Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                icon={<Battery className="text-orange-500" size={32} />}
                value={`${booth.battery_level}%`}
                label="Battery"
              />
              <MetricCard
                icon={<Thermometer className="text-red-500" size={32} />}
                value={`${booth.temperature?.toFixed(1)}°C`}
                label="Temperature"
              />
              <MetricCard
                icon={<HardDrive className="text-blue-500" size={32} />}
                value={`${booth.storage_used_percent}%`}
                label="Storage"
              />
              <MetricCard
                icon={<Signal className="text-purple-500" size={32} />}
                value={`${booth.signal_strength}`}
                label="Signal (dBm)"
              />
              <MetricCard
                icon={<Camera className="text-green-500" size={32} />}
                value={booth.photos_taken_total.toLocaleString()}
                label="Photos"
              />
              <MetricCard
                icon={<Activity className="text-indigo-500" size={32} />}
                value={booth.sessions_count.toLocaleString()}
                label="Sessions"
              />
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Device Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                label="Device Type"
                value={booth.device_type === 'raspberrypi' ? 'Raspberry Pi' : 'Arduino'}
              />
              <InfoRow label="Firmware Version" value={booth.firmware_version} />
              <InfoRow label="Hardware ID" value={booth.hardware_id} monospace />
              <InfoRow label="Region" value={booth.region} />
              <InfoRow
                label="Created"
                value={new Date(booth.created_at).toLocaleDateString()}
              />
              <InfoRow
                label="Last Updated"
                value={new Date(booth.updated_at).toLocaleString()}
              />
            </div>
          </div>

          {/* Historical Charts */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                24-Hour Metrics
              </h2>
              <div className="space-y-8">
                {/* Battery Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Battery Level
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="battery"
                        stroke="#f59e0b"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Temperature Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Temperature
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Storage Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Storage Usage
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="storage"
                        stroke="#3b82f6"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function MetricCard({ icon, value, label }: MetricCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  monospace?: boolean;
}

function InfoRow({ label, value, monospace }: InfoRowProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 font-medium">{label}</p>
      <p
        className={`text-lg font-semibold text-gray-900 mt-1 ${
          monospace ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
