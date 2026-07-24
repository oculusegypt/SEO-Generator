---
name: Workflow shell compatibility
description: Shell commands in Replit workflows may run under POSIX sh rather than Bash.
---

Use POSIX-compatible process supervision in workflow commands; Bash-only features such as `wait -n` can fail even when the same command works locally.

**Why:** The imported app's combined workflow initially failed because `/bin/sh` rejected `wait -n`.

**How to apply:** Prefer portable `sh` syntax, or explicitly invoke Bash when a workflow truly requires Bash-specific behavior.