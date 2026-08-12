# Technical Analysis: Student Profile Expansion & Roster Management

## Executive Summary
This analysis details the exact codebase structure, interfaces, data persistence mechanisms, and UI components involved in student profile management within **NachhilfeTest**. It outlines step-by-step modifications required to expand `StudentProfile` with personality and learning preferences (`hobbies: string[]`, `learningPreferences: string[]`, `customNotes: string`) to empower the zero-cost Gemini Gem AI tutoring engine.

---

## 1. Type Definitions Analysis (`src/types/student.ts`)

### Current State
File: `src/types/student.ts` (11 lines)

```typescript
export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: number | string;
  favoriteSubject: string;
  problemSubject: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Required Modifications
To support structured personality and pedagogical preferences without breaking existing stored profiles or historical test records, `StudentProfile` must be extended with 3 new fields:

```typescript
export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: number | string;
  favoriteSubject: string;
  problemSubject: string;
  notes: string; // Preserved for backwards compatibility
  hobbies?: string[]; // e.g. ['Gaming', 'Fußball', 'Minecraft', 'Musik']
  learningPreferences?: string[]; // e.g. ['Mit Hobbys erklären', 'Schritt-für-Schritt', 'Visuell']
  customNotes?: string; // Extended free-text pedagogical notes
  createdAt: string;
  updatedAt: string;
}
```

### Analysis & Type Safety Considerations
1. **Optionality (`?`)**: Marking `hobbies?: string[]`, `learningPreferences?: string[]`, and `customNotes?: string` as optional ensures backward compatibility when deserializing legacy profiles stored in `localStorage` before this change.
2. **Defensive Defaults**: Downstream components and prompt generators must normalize `student.hobbies || []`, `student.learningPreferences || []`, and `student.customNotes || student.notes || ''`.

---

## 2. Roster Persistence & Helper Functions (`src/utils/studentRoster.ts`)

### Current State
File: `src/utils/studentRoster.ts` (127 lines)
Storage key: `'diagnostic_student_roster'` in `localStorage`.

Key exported functions:
- `getStudentRoster()`: Reads JSON from `localStorage`.
- `getStudentById(id: string)`: Searches roster by ID.
- `saveStudentProfile(data)`: Handles profile creation (generates `std_...` ID) and profile updating.
- `updateStudentProfile(id, updates)`: Performs partial updates via object spread.
- `deleteStudentProfile(id)`: Removes profile by ID.
- `clearStudentRoster()`: Clears storage key.

### Required Modifications

1. **`getStudentRoster()` Sanitization / Migration**:
Ensure default fallback values for new properties when parsing stored profiles:
```typescript
export const getStudentRoster = (): StudentProfile[] => {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const data = storage.getItem(ROSTER_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    
    // Normalize new fields for backward compatibility
    return parsed.map((student: any) => ({
      ...student,
      hobbies: Array.isArray(student.hobbies) ? student.hobbies : [],
      learningPreferences: Array.isArray(student.learningPreferences) ? student.learningPreferences : [],
      customNotes: typeof student.customNotes === 'string' ? student.customNotes : (student.notes || ''),
    }));
  } catch (error) {
    console.error('Failed to read student roster from storage:', error);
    return [];
  }
};
```

2. **`saveStudentProfile()` Function Signature & Persistence**:
Update parameters and payload construction:
```typescript
export const saveStudentProfile = (
  data: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    hobbies?: string[];
    learningPreferences?: string[];
    customNotes?: string;
  }
): StudentProfile => {
  const roster = getStudentRoster();
  const now = new Date().toISOString();

  if (data.id) {
    const index = roster.findIndex((s) => s.id === data.id);
    if (index !== -1) {
      const updatedProfile: StudentProfile = {
        ...roster[index],
        name: data.name,
        gradeLevel: data.gradeLevel,
        favoriteSubject: data.favoriteSubject,
        problemSubject: data.problemSubject,
        notes: data.notes ?? data.customNotes ?? roster[index].notes ?? '',
        hobbies: data.hobbies || roster[index].hobbies || [],
        learningPreferences: data.learningPreferences || roster[index].learningPreferences || [],
        customNotes: data.customNotes ?? data.notes ?? roster[index].customNotes ?? roster[index].notes ?? '',
        updatedAt: now,
      };
      roster[index] = updatedProfile;
      try {
        const storage = getStorage();
        if (storage) storage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
      } catch (error) {
        console.error('Failed to save student profile to storage:', error);
      }
      return updatedProfile;
    }
  }

  const newProfile: StudentProfile = {
    id: data.id || `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    gradeLevel: data.gradeLevel,
    favoriteSubject: data.favoriteSubject || '',
    problemSubject: data.problemSubject || '',
    notes: data.notes || data.customNotes || '',
    hobbies: data.hobbies || [],
    learningPreferences: data.learningPreferences || [],
    customNotes: data.customNotes || data.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  roster.push(newProfile);
  try {
    const storage = getStorage();
    if (storage) storage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
  } catch (error) {
    console.error('Failed to save student profile to storage:', error);
  }
  return newProfile;
};
```

---

## 3. UI Component & Form State Analysis (`StudentSwitcherModal.tsx`)

### Current State
File: `src/components/StudentSwitcherModal.tsx` (515 lines)
Modal modes: `'list' | 'create'`
Controls profile selection, guest mode switching, and new profile creation.

### Required Form Extensions for Profile Creation/Editing

1. **State Extensions**:
```typescript
const [hobbies, setHobbies] = useState<string[]>([]);
const [learningPreferences, setLearningPreferences] = useState<string[]>([]);
const [customNotes, setCustomNotes] = useState('');
const [customHobbyInput, setCustomHobbyInput] = useState('');
const [customPrefInput, setCustomPrefInput] = useState('');
```

2. **Preset Tag Definitions**:
```typescript
export const PRESET_HOBBIES = [
  'Gaming',
  'Fußball',
  'Minecraft',
  'Musik',
  'Lego',
  'Tiere',
  'Sport',
  'Zeichnen',
  'Programmieren',
  'Lesen',
  'Tanzen',
  'Sci-Fi',
];

export const PRESET_PREFERENCES = [
  'Mit Hobbys erklären',
  'Schritt-für-Schritt',
  'Visuell / Diagramme',
  'Spielerisch / Gamification',
  'Kurze Erklärungen',
  'Praxisbeispiele',
  'Keine Fachsprache',
];
```

3. **Tag Toggle & Custom Tag Handlers**:
- **Hobbies Tag Toggle**:
  ```typescript
  const toggleHobby = (hobby: string) => {
    setHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const addCustomHobby = () => {
    const trimmed = customHobbyInput.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies((prev) => [...prev, trimmed]);
      setCustomHobbyInput('');
    }
  };
  ```
- **Learning Preferences Tag Toggle**:
  ```typescript
  const togglePref = (pref: string) => {
    setLearningPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const addCustomPref = () => {
    const trimmed = customPrefInput.trim();
    if (trimmed && !learningPreferences.includes(trimmed)) {
      setLearningPreferences((prev) => [...prev, trimmed]);
      setCustomPrefInput('');
    }
  };
  ```

4. **UI Layout for Tag Selection**:
- Section for **Interessen & Hobbys**: Render preset chips with active styling (`backgroundColor: '#DBEAFE'`, `color: '#1E40AF'`, `border: '1px solid #93C5FD'`). Render active custom chips with a remove `×` button. Render text input + "+" button for custom hobbies.
- Section for **Bevorzugte Lernweise / Stil**: Render preset chips and custom tag input similarly.
- Extended textarea for **Pädagogische Notizen & Besonderheiten** (`customNotes`).

5. **`handleCreateSubmit` Update**:
```typescript
const handleCreateSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;

  const newProfile = saveStudentProfile({
    name: name.trim(),
    gradeLevel,
    favoriteSubject: favoriteSubject.trim(),
    problemSubject: problemSubject.trim(),
    notes: customNotes.trim() || notes.trim(),
    hobbies,
    learningPreferences,
    customNotes: customNotes.trim(),
  });

  refreshRoster();
  handleSelectStudentClick(newProfile);
};
```

---

## 4. Context Integration (`src/context/TestSessionContext.tsx`)

`TestSessionContext` manages the active student state across the app.
- `state.currentStudent` is of type `StudentProfile | null`.
- When `saveCurrentStudentProfile(updates)` or `selectStudent(student)` is called, the full `StudentProfile` object (including `hobbies`, `learningPreferences`, `customNotes`) is retained in `state.currentStudent`.
- Zero changes needed to `TestSessionState` interface contracts, because `currentStudent` already carries the full `StudentProfile` instance.

---

## 5. Implementation Roadmap for Subsequent Agents

1. **Implementer Step 1**: Update `src/types/student.ts` to include `hobbies?: string[]`, `learningPreferences?: string[]`, `customNotes?: string`.
2. **Implementer Step 2**: Update `src/utils/studentRoster.ts` to sanitize loaded data and persist the new profile fields in `saveStudentProfile`.
3. **Implementer Step 3**: Enhance `src/components/StudentSwitcherModal.tsx` with state, tag-picker UI for preset/custom hobbies and learning preferences, and custom notes textarea.
4. **Implementer Step 4**: Add test cases to `src/utils/studentRoster.test.ts` and `src/tests/student_switching.test.ts` to verify CRUD persistence for `hobbies`, `learningPreferences`, and `customNotes`.
