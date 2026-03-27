#!/bin/bash

# Backup Cancellation & Cleanup Test Script
# This script helps verify the backup cancellation and cleanup flow

echo "================================"
echo "Backup Cleanup Verification Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_TEMP="storage/app/backup-temp"

# Test 1: Check if backup-temp exists and contents
echo -e "${YELLOW}Test 1: Checking backup-temp directory...${NC}"
if [ -d "$BASE_TEMP" ]; then
    file_count=$(find "$BASE_TEMP" -type f 2>/dev/null | wc -l)
    dir_count=$(find "$BASE_TEMP" -type d 2>/dev/null | wc -l)
    echo "  Directory exists"
    echo "  Directories: $dir_count"
    echo "  Files: $file_count"
    
    if [ $file_count -eq 0 ] && [ $dir_count -le 1 ]; then
        echo -e "${GREEN}  ✓ Backup-temp is clean${NC}"
    else
        echo -e "${YELLOW}  ⚠ Warning: Orphaned files detected${NC}"
        find "$BASE_TEMP" -type f -exec ls -lh {} \;
    fi
else
    echo -e "${GREEN}  ✓ Backup-temp doesn't exist (clean state)${NC}"
fi

echo ""

# Test 2: Check database for failed backups
echo -e "${YELLOW}Test 2: Checking failed backup records in database...${NC}"
php artisan tinker --execute '
$failedBackups = \App\Models\TenantBackup::where("status", "failed")->count();
if ($failedBackups === 0) {
    echo "\033[32m  ✓ No failed backup records\033[0m\n";
} else {
    echo "\033[33m  ⚠ Found $failedBackups failed backup records\033[0m\n";
    \App\Models\TenantBackup::where("status", "failed")
        ->orderBy("created_at", "desc")
        ->limit(5)
        ->each(function($b) {
            echo "    - " . $b->filename . " (Error: " . $b->error . ")\n";
        });
}
'

echo ""

# Test 3: Run cleanup command
echo -e "${YELLOW}Test 3: Running cleanup command...${NC}"
php artisan backup:cleanup-temp --older-than=0

echo ""

# Test 4: Re-check status
echo -e "${YELLOW}Test 4: Final verification...${NC}"
if [ -d "$BASE_TEMP" ]; then
    file_count=$(find "$BASE_TEMP" -type f 2>/dev/null | wc -l)
    if [ $file_count -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed! Backup cleanup working correctly.${NC}"
    else
        echo -e "${RED}✗ Cleanup failed. Orphaned files still exist.${NC}"
    fi
else
    echo -e "${GREEN}✓ Backup-temp directory cleaned and removed${NC}"
fi

echo ""
echo "================================"
echo "Test Complete"
echo "================================"
