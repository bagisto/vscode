# Change Log

## [1.0.0] - 2024-12-20
### Added
- **Class Import Suggestions**: Introduced auto-suggestions for importing Bagisto classes by typing `wkcl`.
- **Class Template Command**: Added a command to generate and insert a dummy Bagisto class template (`Ctrl + Shift + P` > "Bagisto PHP Class Template").
- **Bagisto Component Import Suggestions**: Auto-suggestions for importing:
  - `wkco` for Controllers
  - `wkre` for Repositories
  - `wkmo` for Models
  - `wkhe` for Helpers
- **Dependency Injection Suggestions**: Automatically suggest Bagisto classes for dependency injection in the constructor using the `wkpr` trigger. Excludes already injected classes.
- **Create Bagisto Module Command**: Added a powerful feature to generate a basic Bagisto module structure. Accessible via `Ctrl + Shift + P` > "Create Bagisto Module".

---

