import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CloudRain, Thermometer, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function WeatherDashboard({ fileData, fileName }) {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const daily = fileData?.daily;

  const chartData = useMemo(() => {
    if (!daily || !daily.time) return [];

    return daily.time.map((timeStr, index) => ({
      date: format(parseISO(timeStr), 'MMM dd'),
      rawDate: timeStr,
      maxTemp: daily.temperature_2m_max[index],
      minTemp: daily.temperature_2m_min[index],
      appMaxTemp: daily.apparent_temperature_max[index],
      appMinTemp: daily.apparent_temperature_min[index],
    }));
  }, [daily]);

  if (!fileData || !chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <CloudRain className="w-16 h-16 mb-4 opacity-50" />
        <p>No valid data found in this file.</p>
      </div>
    );
  }

  const totalRows = chartData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const paginatedData = chartData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          Data View: {fileName}
        </h2>
        <div className="flex items-center gap-4 text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
          <span><span className="font-medium text-slate-200">Lat:</span> {fileData.latitude}</span>
          <span><span className="font-medium text-slate-200">Lon:</span> {fileData.longitude}</span>
          <span><span className="font-medium text-slate-200">Elevation:</span> {fileData.elevation}m</span>
        </div>
      </div>

      {}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl h-[400px]">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          Temperature Trends (°C)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickMargin={10} />
            <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
            <RechartsTooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line type="monotone" name="Max Temp" dataKey="maxTemp" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
            <Line type="monotone" name="Min Temp" dataKey="minTemp" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-sm font-medium text-slate-200">Daily Variables Data</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Max Temp (°C)</th>
                <th className="px-6 py-3 font-medium text-right">Min Temp (°C)</th>
                <th className="px-6 py-3 font-medium text-right">Apparent Max (°C)</th>
                <th className="px-6 py-3 font-medium text-right">Apparent Min (°C)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => (
                <tr key={row.rawDate} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{row.rawDate}</td>
                  <td className="px-6 py-4 text-right text-red-400">{row.maxTemp}</td>
                  <td className="px-6 py-4 text-right text-blue-400">{row.minTemp}</td>
                  <td className="px-6 py-4 text-right text-orange-300">{row.appMaxTemp}</td>
                  <td className="px-6 py-4 text-right text-cyan-300">{row.appMinTemp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div className="p-4 flex items-center justify-between border-t border-slate-700/50 bg-slate-900/20">
          <span className="text-sm text-slate-400">
            Showing <span className="font-medium text-slate-200">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-slate-200">{Math.min(currentPage * rowsPerPage, totalRows)}</span> of <span className="font-medium text-slate-200">{totalRows}</span> entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

