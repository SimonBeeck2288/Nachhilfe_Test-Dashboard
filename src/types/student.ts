export type AccessibilityPreset = 'standard' | 'direct_reduced_sensory' | 'custom';

export interface AccessibilitySettings {
  preset: AccessibilityPreset;
  directQuestions: boolean; // Sachlich-direkte Fragestellungen ohne narrative/metaphorische Ausschmückung
  reducedSensory: boolean;  // Reizreduktion (keine störenden Animationen, ruhige UI)
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  preset: 'standard',
  directQuestions: false,
  reducedSensory: false,
};

export const DIRECT_REDUCED_SENSORY_SETTINGS: AccessibilitySettings = {
  preset: 'direct_reduced_sensory',
  directQuestions: true,
  reducedSensory: true,
};

export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: number | string;
  favoriteSubject: string;
  problemSubject: string;
  notes: string;
  hobbies?: string[];
  learningPreferences?: string[];
  customNotes?: string;
  accessibilitySettings?: AccessibilitySettings;
  createdAt: string;
  updatedAt: string;
}


