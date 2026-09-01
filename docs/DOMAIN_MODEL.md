# Domain Model

- **User** owns instructional preferences, locale, tier, and one **Goal**.
- **Course** contains ordered **Modules**, which contain ordered **Lessons** associated with competencies.
- **Question** is a normalized discriminated union associated with one or more **Competencies**.
- **Attempt** records one submitted answer; an incorrect attempt may produce a categorized **Mistake**.
- **DiagnosticResult**, **PracticeSession**, and **ExamSimulation** aggregate attempts for different support modes.
- **Progress** aggregates lesson, quiz, practice, simulation, and competency evidence.
- **Readiness** is a versioned derivation from progress and may be absent when evidence is insufficient.
- **Recommendation** is a deterministic next action with a reason, type, destination, and priority.
- **Certificate** is derived from lesson and quiz completion; it is never an exam or immigration credential.

IDs and competencies are provider-independent. External adapters map remote identifiers and formats.
