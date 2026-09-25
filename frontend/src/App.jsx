import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import WeatherForm from './components/WeatherForm';
import WeatherDashboard from './components/WeatherDashboard';
import { apiClient } from './api/config';
import { Loader2 } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataStored = (filename) => {
    setRefreshTrigger(prev => prev + 1);
    handleSelectFile(filename);
  };

  const handleNewRequest = () => {
    setSelectedFile(null);
    setFileData(null);
    setFileError('');
  };

  const handleSelectFile = async (filename) => {
    setSelectedFile(filename);
    setLoadingFile(true);
    setFileError('');
    setFileData(null);

    try {
      const response = await apiClient.get(`/weather-file-content/${filename}`);
      setFileData(response.data);
    } catch (err) {
      setFileError('Failed to load file content. It may have been deleted or corrupted.');
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <Sidebar
        onSelectFile={handleSelectFile}
        selectedFile={selectedFile}
        refreshTrigger={refreshTrigger}
        onNewRequest={handleNewRequest}
      />

      <main className="flex-1 h-full overflow-y-auto relative">
        {}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto p-8 lg:p-12 min-h-full flex flex-col">
          {!selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Weather Data Explorer</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Request new historical data from Open-Meteo or select an existing file from the sidebar to visualize trends.
                </p>
              </div>
              <div className="w-full">
                <WeatherForm onDataStored={handleDataStored} />
              </div>
            </div>
          ) : (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loadingFile ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin text-indigo-500" />
                  <p>Loading file content...</p>
                </div>
              ) : fileError ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl flex flex-col items-center justify-center h-64">
                  <p className="text-lg font-medium">{fileError}</p>
                  <button
                    onClick={handleNewRequest}
                    className="mt-4 text-sm underline hover:text-red-300"
                  >
                    Go back
                  </button>
                </div>
              ) : (
                <WeatherDashboard fileData={fileData} fileName={selectedFile} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

