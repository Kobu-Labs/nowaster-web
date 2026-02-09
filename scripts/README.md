# Scripts

This directory contains utility scripts for the Nowaster project.

## create-release.sh

Creates a release branch with squashed commits ready for PR to production.

### Usage

```bash
./scripts/create-release.sh <version>
```

### Example

```bash
./scripts/create-release.sh 1.3.0
```

### What it does

1. Fetches latest changes from origin
2. Creates a new branch `release-<version>` from `production`
3. Copies all files from `main` branch
4. Commits changes as a single squashed commit
5. Pushes the branch to origin
6. Provides instructions for creating a PR

### Requirements

- Must have `production` and `main` branches
- Must have push access to the repository
- Working directory should be clean (no uncommitted changes)

### Notes

- The script will fail if the release branch already exists
- All changes from `main` are squashed into a single commit
- The commit message includes the version number
