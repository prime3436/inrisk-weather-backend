import { useEffect, useState } from 'react';
import { apiClient } from '../api/config';
import { FileJson, RefreshCw, Loader2, PlusCircle } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

export default function Sidebar({ onSelectFile, selectedFile, refreshTrigger, onNewRequest }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/list-weather-files');
      setFiles(response.data.files || []);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  return (
    <div className="w-80 h-screen bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          InRisk Weather
        </h1>
      </div>

      <div className="p-4">
        <button 
          onClick={onNewRequest}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="font-medium text-sm">New Data Request</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stored Files</h2>
          <button 
            onClick={fetchFiles} 
            disabled={loading}
            className="text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {error ? (
          <div className="px-2 text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
            {error}
          </div>
        ) : loading && files.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center p-6 text-sm text-slate-500">
            No files stored yet.
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => onSelectFile(f.name)}
                className={clsx(
                  "w-full text-left p-3 rounded-xl transition-all border block group relative overflow-hidden",
                  selectedFile === f.name 
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-inner shadow-indigo-500/10" 
                    : "bg-slate-800/30 border-transparent hover:bg-slate-800/80 hover:border-slate-700"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "p-2 rounded-lg shrink-0 transition-colors",
                    selectedFile === f.name ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700"
                  )}>
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={clsx(
                      "text-sm font-medium truncate mb-1 transition-colors",
                      selectedFile === f.name ? "text-indigo-200" : "text-slate-300"
                    )} title={f.name}>
                      {f.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{(f.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{f.created_at ? format(parseISO(f.created_at), 'MMM d, HH:mm') : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
