import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getCityWeather, generateIsometricCity } from './services/geminiService';
import GlassyLoader from './components/GlassyLoader';
import WeatherCard from './components/WeatherCard';
import TiredMascot from './components/TiredMascot';
import UserMenu from './components/UserMenu';
import Onboarding from './components/Onboarding';
import PrivacyPolicy from './components/PrivacyPolicy';
import StoragePermission from './components/StoragePermission';
import AdBanner from './components/AdBanner';
import ShareButton from './components/ShareButton';
import { AppState, WeatherData } from './types';

// ==========================================
// 🔧 CONFIGURATION: ADVERTISEMENT ID
// ==========================================
const AD_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'; 
// ==========================================

const USERNAME_KEY = 'Atmolite_username';
const STORAGE_PERMISSION_KEY = 'Atmolite_storage_permission';

const App: React.FC = () => {
  const [cityInput, setCityInput] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [username, setUsername] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showStoragePermission, setShowStoragePermission] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);

  const checkStoragePermission = useCallback(() => {
    const hasPermission = localStorage.getItem(STORAGE_PERMISSION_KEY);
    if (!hasPermission) {
      setShowStoragePermission(true);
    }
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem(USERNAME_KEY);
    if (!storedName) {
      setShowOnboarding(true);
    } else {
      setUsername(storedName);
      checkStoragePermission();
    }
  }, [checkStoragePermission]);

  const handleSaveName = useCallback((name: string) => {
    localStorage.setItem(USERNAME_KEY, name);
    setUsername(name);
    setShowOnboarding(false);
    setTimeout(() => setShowStoragePermission(true), 500);
  }, []);

  const handleStorageDecision = useCallback((allowed: boolean) => {
    localStorage.setItem(STORAGE_PERMISSION_KEY, allowed ? 'granted' : 'denied');
    setShowStoragePermission(false);
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cityInput.trim()) return;

    try {
      setErrorMsg('');
      setAppState(AppState.FETCHING_WEATHER);
      
      const data = await getCityWeather(cityInput);
      setWeatherData(data);

      setAppState(AppState.GENERATING_IMAGE);
      
      const imageUrl = await generateIsometricCity(data);
      setGeneratedImage(imageUrl);

      setAppState(AppState.DISPLAY);
    } catch (err: any) {
      console.error(err);
      
      if (err.message === "MISSING_API_KEY") {
        setErrorMsg("API Key missing! Please check configuration.");
        setAppState(AppState.ERROR);
      } else if (err.message && (err.message.includes('403') || err.message.includes('Permission Denied'))) {
        setErrorMsg("Access Denied. Please check API Key.");
        setAppState(AppState.ERROR);
      } else {
        setErrorMsg(err.message || "Unable to retrieve city data. Please try again.");
        setAppState(AppState.ERROR);
      }
    }
  }, [cityInput]);

  const handleReset = useCallback(() => {
    setAppState(AppState.IDLE);
    setCityInput('');
    setWeatherData(null);
    setGeneratedImage('');
  }, []);

  const handleOpenPrivacy = useCallback(() => setShowPrivacy(true), []);
  const handleClosePrivacy = useCallback(() => setShowPrivacy(false), []);
  const handleAllowStorage = useCallback(() => handleStorageDecision(true), [handleStorageDecision]);
  const handleDenyStorage = useCallback(() => handleStorageDecision(false), [handleStorageDecision]);

  const isDailyLimitError = useMemo(() => errorMsg.includes("Daily free limit reached"), [errorMsg]);
  const isRpmError = useMemo(() => errorMsg.includes("Too many requests"), [errorMsg]);
  const isModalOpen = useMemo(() => showOnboarding || showStoragePermission, [showOnboarding, showStoragePermission]);
  const isDarkBg = appState === AppState.DISPLAY && !weatherData?.isDay;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gray-100 font-sans p-0 md:p-4 overflow-hidden">
      <div className="relative w-full h-[100dvh] md:h-[90dvh] md:w-auto md:aspect-[9/16] md:max-h-[900px] bg-white md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden md:border-8 md:border-white md:ring-1 md:ring-gray-200 flex flex-col">
        
        {showOnboarding && <Onboarding onComplete={handleSaveName} />}
        {showStoragePermission && <StoragePermission onAllow={handleAllowStorage} onDeny={handleDenyStorage} />}
        {showPrivacy && <PrivacyPolicy onClose={handleClosePrivacy} />}

        {!isModalOpen && !isDailyLimitError && (
          <UserMenu username={username} onOpenPrivacy={handleOpenPrivacy} isDarkBackground={isDarkBg} />
        )}

        {appState === AppState.IDLE && (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-white text-center pb-20">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Atmolite</h1>
            <p className="text-slate-500 mb-8 text-sm">Discover your city in a miniature atmospheric world.</p>
            <form onSubmit={handleSearch} className="w-full space-y-4">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Enter city (e.g. Kyoto)"
                className="w-full px-6 py-4 rounded-xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 text-lg transition-all"
              />
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-lg hover:bg-slate-800 transition-transform active:scale-95 shadow-lg"
              >
                Explore Weather
              </button>
            </form>
          </div>
        )}

        {(appState === AppState.FETCHING_WEATHER || appState === AppState.GENERATING_IMAGE) && (
          <GlassyLoader status={appState === AppState.FETCHING_WEATHER ? "Consulting the skies..." : `Painting ${weatherData?.cityNativeName || cityInput}...`} />
        )}

        {appState === AppState.ERROR && isDailyLimitError && <TiredMascot onReset={handleReset} />}

        {appState === AppState.ERROR && !isDailyLimitError && (
          <div className={`h-full flex flex-col items-center justify-center p-8 text-center pb-20 ${isRpmError ? 'bg-amber-50' : 'bg-red-50'}`}>
            <div className="text-5xl mb-4">{isRpmError ? '⏳' : '⛈️'}</div>
            <h3 className={`text-xl font-bold mb-2 ${isRpmError ? 'text-amber-800' : 'text-red-800'}`}>{isRpmError ? 'Too Fast!' : 'Oops!'}</h3>
            <p className={`mb-6 ${isRpmError ? 'text-amber-700' : 'text-red-600'}`}>{errorMsg}</p>
            <button
              onClick={handleReset}
              className={`px-6 py-3 rounded-lg transition-colors font-semibold ${isRpmError ? 'bg-amber-200 text-amber-900 hover:bg-amber-300' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
            >
              {isRpmError ? 'Wait a moment' : 'Try Again'}
            </button>
          </div>
        )}

        {appState === AppState.DISPLAY && weatherData && (
          <>
            <WeatherCard image={generatedImage} data={weatherData} />
            
            <ShareButton 
              weatherData={weatherData} 
              imageUri={generatedImage} 
              username={username}
              isDarkBackground={isDarkBg}
            />

            <button 
              onClick={handleReset}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white border border-white/30 transition-all z-20 shadow-lg flex items-center justify-center active:scale-90"
              aria-label="Search another city"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </>
        )}

        {!isDailyLimitError && <AdBanner adUnitId={AD_BANNER_ID} />}
      </div>
    </div>
  );
};

export default App;