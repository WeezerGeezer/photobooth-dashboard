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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading booth details...</p>
        </div>
      </div>
    );
  }

  if (error || !booth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
    .map((hc) => ({
      time: new Date(hc.timestamp).toLocaleTimeString(),
      battery: hc.battery_level,
      temperature: hc.temperature,
      storage: hc.storage_used_percent,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
            <div className={`${getStatusBg(booth.status)} px-4 py-2 rounded-lg`}>
              <p className={`font-semibold ${getStatusColor(booth.status)}`}>
                {booth.status === 'online' ? (
                  <span className="flex items-center gap-2">
                    <Wifi size={20} />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <WifiOff size={20} />
                    Offline
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Current Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <Battery className="text-orange-500 mx-auto mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-900">
                {booth.battery_level}%
              </p>
              <p className="text-sm text-gray-600">Battery</p>
            </div>
            <div className="text-center">
              <Thermometer className="text-red-500 mx-auto mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-900">
                {booth.temperature?.toFixed(1)}°C
              </p>
              <p className="text-sm text-gray-600">Temperature</p>
            </div>
            <div className="text-center">
              <HardDrive className="text-blue-500 mx-auto mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-900">
                {booth.storage_used_percent}%
              </p>
              <p className="text-sm text-gray-600">Storage</p>
            </div>
            <div className="text-center">
              <Signal className="text-purple-500 mx-auto mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-900">
                {booth.signal_strength}
              </p>
              <p className="text-sm text-gray-600">Signal (dBm)</p>
            </div>
            <div className="text-center">
              <Camera className="text-green-500 mx-auto mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-900">
                {booth.photos_taken_total}
              </p>
              <p className="text-sm text-gray-600">Photos</p>
            </div>
            <div className="text-center">
              <Activity className="text-indigo-500 mx-auto mb-2" size={32} />
              <p className="text-2xl font-bold text-gray-900">
                {booth.sessions_count}
              </p>
              <p className="text-sm text-gray-600">Sessions</p>
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Device Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Device Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {booth.device_type === 'raspberrypi'
                  ? 'Raspberry Pi'
                  : 'Arduino'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Firmware Version</p>
              <p className="text-lg font-semibold text-gray-900">
                {booth.firmware_version}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hardware ID</p>
              <p className="text-lg font-semibold text-gray-900 font-mono">
                {booth.hardware_id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Region</p>
              <p className="text-lg font-semibold text-gray-900">
                {booth.region}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(booth.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(booth.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Historical Charts */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              7-Day Metrics
            </h2>
            <div className="space-y-8">
              {/* Battery Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Battery Level
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="battery"
                      stroke="#f59e0b"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Temperature Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Temperature
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#ef4444"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Storage Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Storage Usage
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="storage"
                      stroke="#3b82f6"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
