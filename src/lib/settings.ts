export type Settings = {
  speed: number;
  mirror: boolean;
  loop: boolean;
  questionCount: number;
  topicIds: string[];
  /** I "Vad betyder tecknet?": välj bland fyra alternativ i stället för att skriva. */
  multipleChoice: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  speed: 1,
  mirror: false,
  loop: true,
  questionCount: 10,
  topicIds: [],
  multipleChoice: false,
};

const KEY = 'mesign.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Ignoreras, se saveProgress.
  }
}
