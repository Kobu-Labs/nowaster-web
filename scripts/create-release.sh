#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: ./scripts/create-release.sh <version>"
    echo "Example: ./scripts/create-release.sh 1.2.0"
    exit 1
fi

VERSION="$1"
BRANCH_NAME="release-$VERSION"

echo -e "${YELLOW}Creating release branch: ${BRANCH_NAME}${NC}"

# Fetch latest changes
echo "Fetching latest changes from origin..."
git fetch origin

# Check if branch already exists
if git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
    echo -e "${RED}Error: Branch $BRANCH_NAME already exists locally${NC}"
    echo "Delete it first with: git branch -D $BRANCH_NAME"
    exit 1
fi

if git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
    echo -e "${RED}Error: Branch $BRANCH_NAME already exists on remote${NC}"
    exit 1
fi

# Create new branch from production
echo "Creating branch from production..."
git checkout production
git pull origin production
git checkout -b "$BRANCH_NAME"

# Copy all files from main
echo "Copying files from main..."
git checkout main -- .

# Check if there are any changes
if git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to commit - main and production are identical${NC}"
    git checkout production
    git branch -D "$BRANCH_NAME"
    exit 0
fi

# Count changes
FILE_COUNT=$(git status --short | wc -l)
echo -e "${GREEN}Found $FILE_COUNT changed files${NC}"

# Commit the changes
echo "Committing release..."
git add -A
git commit -m "Release v${VERSION}

This release includes all changes from main branch.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Show commit info
echo -e "${GREEN}✓ Created commit:${NC}"
git log --oneline -1

# Push to remote
echo "Pushing to origin..."
git push origin "$BRANCH_NAME" -u

echo -e "${GREEN}✓ Success!${NC}"
echo ""
echo "Next steps:"
echo "1. Create a PR on GitHub:"
echo "   ${GREEN}https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/compare/production...$BRANCH_NAME${NC}"
echo ""
echo "2. Or use the GitHub CLI:"
echo "   ${GREEN}gh pr create --base production --head $BRANCH_NAME --title \"Release v${VERSION}\" --body \"Release v${VERSION}\"${NC}"
