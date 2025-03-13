#!/bin/bash

# Script to create a production branch with squashed commits between releases
# This rewrites git history - use with caution!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_BRANCH="production"
DRY_RUN=false
BACKUP_BRANCH="backup-before-production-$(date +%Y%m%d-%H%M%S)"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run    Show what would be done without making changes"
            echo "  --help       Show this help message"
            echo ""
            echo "This script creates a production branch with squashed commits between releases."
            echo "It will move release tags to the new production branch."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Preflight checks
log_info "Running preflight checks..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    log_error "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get all release tags sorted by version
log_info "Fetching release tags..."
TAGS=($(git tag -l 'v*' | sort -V))

if [ ${#TAGS[@]} -eq 0 ]; then
    log_error "No release tags found (v*)"
    exit 1
fi

log_success "Found ${#TAGS[@]} release tags: ${TAGS[*]}"

# Verify all tagged commits are accessible
log_info "Verifying all tagged commits are accessible..."
MISSING_COMMITS=false
for tag in "${TAGS[@]}"; do
    tag_commit=$(git rev-list -n 1 $tag 2>/dev/null || echo "")
    if [ -z "$tag_commit" ]; then
        log_error "Cannot resolve tag: $tag"
        MISSING_COMMITS=true
        continue
    fi

    # Check if we can access the commit
    if ! git cat-file -e $tag_commit 2>/dev/null; then
        log_error "Commit $tag_commit (tag: $tag) is not available locally"
        MISSING_COMMITS=true
        continue
    fi

    # Check if we can read the tree (file contents)
    if ! git ls-tree -r $tag_commit > /dev/null 2>&1; then
        log_error "Cannot read tree for commit $tag_commit (tag: $tag)"
        MISSING_COMMITS=true
        continue
    fi
done

if [ "$MISSING_COMMITS" = true ]; then
    log_error "Some tagged commits are not accessible"
    log_info "You may need to fetch missing commits/tags:"
    log_info "  git fetch origin --tags"
    log_info "  git fetch origin +refs/heads/*:refs/remotes/origin/*"
    exit 1
fi

log_success "All tagged commits are accessible"

# Check if production branch already exists
if git show-ref --verify --quiet refs/heads/$PRODUCTION_BRANCH; then
    log_warning "Branch '$PRODUCTION_BRANCH' already exists"
    read -p "Do you want to delete it and recreate? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Aborted by user"
        exit 0
    fi
    if [ "$DRY_RUN" = false ]; then
        git branch -D $PRODUCTION_BRANCH
        log_info "Deleted existing $PRODUCTION_BRANCH branch"
    else
        log_info "[DRY RUN] Would delete existing $PRODUCTION_BRANCH branch"
    fi
fi

# Show what will be done
echo ""
log_info "========================================="
log_info "PRODUCTION BRANCH CREATION PLAN"
log_info "========================================="
echo ""
log_info "The script will:"
echo "  1. Create backup branch: $BACKUP_BRANCH"
echo "  2. Create orphan branch: $PRODUCTION_BRANCH"
echo "  3. Process ${#TAGS[@]} releases:"
echo ""

for i in "${!TAGS[@]}"; do
    tag="${TAGS[$i]}"
    if [ $i -eq 0 ]; then
        prev_ref="--root"
        range_desc="from beginning"
        commit_count=$(git rev-list --count $tag)
    else
        prev_tag="${TAGS[$i-1]}"
        prev_ref="$prev_tag"
        range_desc="from $prev_tag"
        commit_count=$(git rev-list --count $prev_ref..$tag)
    fi

    echo "     $tag: squash $commit_count commits ($range_desc)"
done

echo ""
log_warning "This will move tags from their original commits to new squashed commits!"
log_warning "Original commit history will be preserved in: $BACKUP_BRANCH"
echo ""

if [ "$DRY_RUN" = true ]; then
    log_info "DRY RUN MODE - No changes will be made"
    echo ""
    log_info "Run without --dry-run to execute the changes"
    exit 0
fi

# Confirm before proceeding
read -p "Do you want to proceed? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_info "Aborted by user"
    exit 0
fi

echo ""
log_info "========================================="
log_info "EXECUTING PRODUCTION BRANCH CREATION"
log_info "========================================="
echo ""

# Create backup branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Creating backup branch: $BACKUP_BRANCH"
git branch $BACKUP_BRANCH
log_success "Backup created at branch: $BACKUP_BRANCH"

# Create orphan production branch
log_info "Creating orphan branch: $PRODUCTION_BRANCH"
git checkout --orphan $PRODUCTION_BRANCH
git rm -rf . > /dev/null 2>&1 || true
log_success "Created orphan branch: $PRODUCTION_BRANCH"

# Process each release tag
for i in "${!TAGS[@]}"; do
    tag="${TAGS[$i]}"
    tag_commit=$(git rev-list -n 1 $tag)

    if [ $i -eq 0 ]; then
        prev_ref=""
        log_info "Processing $tag (initial release from $tag_commit)"
    else
        prev_tag="${TAGS[$i-1]}"
        prev_ref="$prev_tag"
        log_info "Processing $tag (from $prev_tag to $tag_commit)"
    fi

    # Extract commit message and metadata from the tagged commit
    commit_subject=$(git log -1 --format=%s $tag)
    commit_body=$(git log -1 --format=%b $tag)
    commit_author=$(git log -1 --format="%an <%ae>" $tag)
    commit_date=$(git log -1 --format=%aI $tag)

    # Remove all existing files first (except for first commit)
    # This ensures we get EXACTLY the files from the tag, not accumulated files
    if [ $i -ne 0 ]; then
        log_info "Removing previous files..."
        git rm -rf . > /dev/null 2>&1 || true
    fi

    # Checkout files from the release tag
    # This works even if the tag's commit is not in the current branch
    log_info "Checking out files from $tag..."
    if ! git checkout $tag -- . 2>/dev/null; then
        log_error "Failed to checkout files from tag $tag"
        log_error "Commit: $tag_commit"
        log_info "Aborting. Cleanup required - delete the production branch manually."
        exit 1
    fi

    # Verify we actually got files
    if [ -z "$(ls -A)" ] && [ $i -ne 0 ]; then
        log_warning "No files checked out from $tag (working directory is empty)"
    fi

    # Add all files
    git add -A

    # Check if there are any changes to commit (except for first commit)
    if [ $i -ne 0 ] && git diff --cached --quiet; then
        log_warning "No changes detected between $prev_tag and $tag"
        log_info "This might indicate tags pointing to the same tree - continuing anyway"
    fi

    # Create commit message
    if [ $i -eq 0 ]; then
        commit_count=$(git rev-list --count $tag)
    else
        commit_count=$(git rev-list --count $prev_ref..$tag)
    fi

    # Build commit message
    commit_msg="Release $tag

$commit_subject

This release squashes $commit_count commits from the original history.

Original commit: $tag_commit"

    if [ -n "$commit_body" ]; then
        commit_msg="$commit_msg

Original commit message body:
$commit_body"
    fi

    # Create the squashed commit with original author and date
    GIT_AUTHOR_NAME=$(echo $commit_author | sed 's/ <.*//') \
    GIT_AUTHOR_EMAIL=$(echo $commit_author | sed 's/.*<\(.*\)>/\1/') \
    GIT_AUTHOR_DATE="$commit_date" \
    git commit -m "$commit_msg" --allow-empty

    new_commit=$(git rev-parse HEAD)
    log_success "Created commit $new_commit for $tag"

    # Delete old tag and create new one pointing to the squashed commit
    log_info "Moving tag $tag to new commit..."
    git tag -d $tag
    git tag -a $tag -m "Release $tag (squashed)" $new_commit

    log_success "Moved tag $tag to production branch"
    echo ""
done

# Summary
echo ""
log_info "========================================="
log_success "PRODUCTION BRANCH CREATED SUCCESSFULLY"
log_info "========================================="
echo ""
log_info "Summary:"
echo "  - Production branch: $PRODUCTION_BRANCH"
echo "  - Releases processed: ${#TAGS[@]}"
echo "  - Backup branch: $BACKUP_BRANCH"
echo ""
log_info "Next steps:"
echo "  1. Review the production branch: git log $PRODUCTION_BRANCH --oneline"
echo "  2. If everything looks good, you may want to:"
echo "     - Push the branch: git push -u origin $PRODUCTION_BRANCH"
echo "     - Push tags (force): git push origin --tags --force"
echo ""
log_warning "Note: To push the moved tags, you'll need to force push:"
echo "  git push origin --tags --force"
echo ""
log_info "To restore from backup if needed:"
echo "  git checkout $BACKUP_BRANCH"
echo "  git branch -D $PRODUCTION_BRANCH"
echo ""

# Return to original branch or stay on production
read -p "Do you want to stay on the production branch? (yes/no): " stay
if [ "$stay" != "yes" ]; then
    git checkout $CURRENT_BRANCH
    log_info "Returned to branch: $CURRENT_BRANCH"
else
    log_info "Staying on branch: $PRODUCTION_BRANCH"
fi
