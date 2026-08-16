# Original User Request

## 2026-08-16T19:15:09Z

Implement multi-device synchronization for student profiles and test session history in NachhilfeTest using GitHub Gist and JSON File Export/Import.

Working directory: c:/Users/beeck/git/repos/NachhilfeTest
Integrity mode: development

## Requirements

### R1. Data Export & Import (JSON File-based)
- Provide export functionality that bundles all student profiles (roster) and session histories into a structured JSON file.
- Provide import functionality that parses the JSON file, validates schema integrity, and merges or restores student profiles and test history without corrupting existing records.
- Handle corrupted files, schema version mismatches, and invalid JSON gracefully with informative user feedback and zero crash states.

### R2. Remote Cloud Sync via GitHub Gist
- Provide a synchronization modal/settings interface where users can configure a GitHub Personal Access Token (PAT) and/or a Gist ID.
- Support **Push to Gist** (uploads current roster and test history to a private Gist) and **Pull from Gist** (fetches and merges remote roster and session history).
- Securely store user-provided tokens in local client storage and include conflict-resolution strategies (e.g. merge by latest timestamp / ID matching).

### R3. UI Integration & Accessibility
- Integrate sync and backup triggers into the Student Switcher Modal, Test Configurator, and/or Top Navigation bar.
- Maintain full keyboard accessibility, focus management, and dark/reduced-sensory theme compliance.

## Verification Resources
- Existing Vitest test runner: `npm run test` (392 existing unit and integration tests).
- Existing data schema modules: `src/types/student.ts`, `src/types/history.ts`, `src/utils/studentRoster.ts`, `src/utils/sessionHistory.ts`.

## Acceptance Criteria

### Data Portability & Merge Logic
- [ ] Exporting produces a valid JSON payload containing both `diagnostic_student_roster` and `diagnostic_session_history` records.
- [ ] Importing valid JSON properly updates student rosters and session histories in storage.
- [ ] Attempting to import non-JSON, empty, or malformed payloads fails gracefully with a non-fatal error message.
- [ ] Merging remote and local profiles preserves existing students with identical IDs using `updatedAt` timestamps.

### Gist Sync & Remote Communication
- [ ] GitHub Gist API client supports creating, updating, and fetching private sync Gists via GitHub REST API.
- [ ] Network errors (e.g. invalid token, rate limiting, offline mode) display helpful error notices without disrupting test sessions.

### Automated Test Suite
- [ ] New unit and integration tests are added for JSON export/import and GitHub Gist sync logic.
- [ ] `npm run test` passes 100% with 0 failing test suites.
- [ ] `npm run lint` passes without errors.
