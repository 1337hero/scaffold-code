# Project standards

> Enforceable rules for **this** repo. REVIEW checks the diff against these before closeout.
> Tag each rule **`Check:`** (a tool can verify it — name the tool) or **`Judgment:`** (a
> human/agent call). **Promote `Judgment:` → `Check:` whenever a tool can take it over** — a rule
> a human has to remember is the weakest kind. Keep the list few, specific, and current.

## Conventions
<!-- Fill per project. Examples: -->
- Components under ~200 lines; extract past that. **Judgment:** (review).
- No barrel files; import from the source file. **Check:** `eslint no-restricted-imports`.
- Reuse shared utilities before a new helper (rule of 3). **Judgment:** (review).

## Testing
- Cheapest tier that proves it; browser/e2e only for real user journeys. **Judgment:**.
- Every bug fix lands a regression test that fails before the fix. **Check:** (CI: red-before-green).

## Definition of done
- Required checks green; reviewed by someone other than the author; reversible with a known
  rollback. **Check:** (CI + PR gate).

## Stack notes
<!-- Build/test/deploy commands, the CI gate, branch/preview model — anything load-bearing and
     easy to get wrong. Mirror the key ones into memory/STATE.md → "Key files / commands". -->
