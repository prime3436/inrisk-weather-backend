import { useState } from 'react';
import { apiClient } from '../api/config';
import { Loader2 } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function WeatherForm({ onDataStored }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    start_date: '',
    end_date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.latitude || !formData.longitude || !formData.start_date || !formData.end_date) {
      setError('All fields are required.');
      return;
    }

    const start = parseISO(formData.start_date);
    const end = parseISO(formData.end_date);

    if (start > end) {
      setError('Start date must be before end date.');
      return;
    }

    const days = differenceInDays(end, start) + 1;
    if (days > 31) {
      setError(`Date range cannot exceed 31 days (currently ${days} days).`);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/store-weather-data', {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        start_date: formData.start_date,
        end_date: formData.end_date
      });

      onDataStored(response.data.file);

      setFormData({
        latitude: '',
        longitude: '',
        start_date: '',
        end_date: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-white">Fetch Historical Weather</h2>
      <p className="text-sm text-slate-400 mb-6">Enter coordinates and a date range (max 31 days) to pull data into storage.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="e.g. 52.52"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="e.g. 13.41"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Fetch & Store Data'
          )}
        </button>
      </form>
    </div>
  );
}

