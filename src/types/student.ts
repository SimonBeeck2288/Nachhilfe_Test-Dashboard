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
  createdAt: string;
  updatedAt: string;
}

