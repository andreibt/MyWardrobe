import AsyncStorage from "@react-native-async-storage/async-storage";

export type WeatherDay = {
  date: string;
  min: number;
  max: number;
  precipitation: number;
  weatherCode: number;
};

type CachedWeather = {
  fetchedAt: number;
  days: WeatherDay[];
};

const CACHE_KEY = "polarnest.wardrobeCalendar.weather";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_LATITUDE = 44.4268;
const DEFAULT_LONGITUDE = 26.1025;
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LATITUDE}` +
  `&longitude=${DEFAULT_LONGITUDE}` +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&forecast_days=7&timezone=auto";

export async function getWardrobeCalendarWeather(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await readCachedWeather();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.days;
    }
  }

  const response = await fetch(WEATHER_URL);
  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }
  const payload = await response.json();
  const daily = payload.daily ?? {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  const days: WeatherDay[] = dates.map((date: string, index: number) => ({
    date,
    min: Number(daily.temperature_2m_min?.[index] ?? 0),
    max: Number(daily.temperature_2m_max?.[index] ?? 0),
    precipitation: Number(daily.precipitation_probability_max?.[index] ?? 0),
    weatherCode: Number(daily.weather_code?.[index] ?? 0),
  }));

  await AsyncStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      fetchedAt: Date.now(),
      days,
    })
  );

  return days;
}

async function readCachedWeather() {
  try {
    const value = await AsyncStorage.getItem(CACHE_KEY);
    if (!value) {
      return null;
    }
    const parsed = JSON.parse(value) as CachedWeather;
    return Array.isArray(parsed.days) && typeof parsed.fetchedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function getWeatherSummary(weatherCode: number) {
  if (weatherCode === 0) {
    return "Clear";
  }
  if ([1, 2, 3].includes(weatherCode)) {
    return "Clouds";
  }
  if ([45, 48].includes(weatherCode)) {
    return "Fog";
  }
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return "Rain";
  }
  if (weatherCode >= 71 && weatherCode <= 77) {
    return "Snow";
  }
  if (weatherCode >= 95) {
    return "Storm";
  }
  return "Mixed";
}
