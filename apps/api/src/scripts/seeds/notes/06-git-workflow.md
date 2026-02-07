# Git Workflow Notes

My preferred workflow for feature development.

## Branch Strategy

```
main          → production-ready code
develop       → integration branch
feature/*     → new features
fix/*         → bug fixes
```

## Daily Workflow

```bash
git fetch origin
git checkout -b feature/my-feature
# ... make changes ...
git add -p                    # Stage interactively
git commit -m "feat: add X"   # Conventional commits
git push -u origin HEAD
```

## Commit Message Format

```
type(scope): description

feat:     New feature
fix:      Bug fix
docs:     Documentation
refactor: Code restructuring
test:     Adding tests
chore:    Maintenance
```

## Useful Commands

```bash
git stash -u              # Stash including untracked
git log --oneline -10     # Recent history
git diff --staged         # What's about to commit
git reset HEAD~1          # Undo last commit (keep changes)
```

## Golden Rules

- Never force push to main
- Rebase before merging
- Write meaningful commit messages
