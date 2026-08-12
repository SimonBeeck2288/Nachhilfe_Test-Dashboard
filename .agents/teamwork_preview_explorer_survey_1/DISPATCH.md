## 2026-08-09T00:42:30Z
You are teamwork_preview_explorer_survey_1. Your working directory is c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_1.
Your task is to conduct a technical survey of the NachhilfeTest codebase for the Übungs-Generator (Practice Generator) feature, specifically focusing on UI Navigation & Configuration.

Requirements to investigate in ORIGINAL_REQUEST.md and codebase:
1. Navigation: Link to Practice Generator in Layout navigation bar (Layout.tsx).
2. Student Profile & Grade: Display student's current grade (Klasse), listing of topics relevant for student's grade.
3. Topic Performance & Visual Highlight: Calculation/display of topic accuracy from student stats; highlight topics with < 70% accuracy as "Ausbaubedarf".
4. Topic Selection & Level Prefill: Topic selection/deselection UI, target level per topic (level 1-7, prefilled with student's current target level).
5. Settings: Subject selection (Mathe, Englisch, Both/Kombiniert), Question count (5, 10, 15, 20), Timer disable toggle.

Please inspect existing components in `src/components/`, `src/types/`, `src/context/` or state management files, existing routes/views, and `ORIGINAL_REQUEST.md`.

Write your detailed findings to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_1\analysis.md` and a summary handoff report to `c:\Users\beeck\git\repos\NachhilfeTest\.agents\teamwork_preview_explorer_survey_1\handoff.md`. Communicate back when done.
