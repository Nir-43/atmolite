export interface WeatherData {
  temperature: string;
  condition: string;
  date: string;
  cityNativeName: string;
  cityName: string;
  iconDescription: string; // e.g., "sunny", "rainy", "cloudy"
  isDay: boolean; // True for Day, False for Night
  sources?: string[];
}

export interface GeneratedScene {
  imageUrl: string;
  weatherData: WeatherData;
}

export interface CachedVisual {
  imageUrl: string;
  timestamp: number; // Epoch time when generated
  source: 'local' | 'repository';
}

export enum AppState {
  IDLE,
  FETCHING_WEATHER,
  GENERATING_IMAGE,
  DISPLAY,
  ERROR
}