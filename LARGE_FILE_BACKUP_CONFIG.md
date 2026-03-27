# 10-20 GB Veri Yönetimi - Configuration Guide

## 🎯 Optimizations Applied

### 1. **Stream-Based ZIP Creation (No Temp Files)**
- S3 → Directly to ZIP (bypassing temp storage)
- Memory usage: 2-3 MB constant (streaming chunks)
- Works with files up to 20+ GB

### 2. **Serial Processing (Batch Size = 1)**
- One file downloaded at a time
- Prevents memory exhaustion
- Ensures complete downloads before next file

### 3. **Adaptive Timeout (120s - 7200s)**
- Calculation: 1 MB = 1 second
- Minimum: 120 seconds (for small files)
- Maximum: 7200 seconds (2 hours per file)
- Example: 550 MB = 550 seconds, 20 GB = 20,000 seconds → capped at 7200s

### 4. **Memory Optimization**
- Memory limit: 2048 MB (2 GB) for queue workers
- Applies to both `CreateTenantBackupJob` and `BackupTenantJob`
- Streaming chunks use PHP's internal buffers (2-3 MB typical)

### 5. **ZipArchive::addStream()**
- Directly adds S3 stream to ZIP without intermediate file
- Memory safe: chunks stream directly from S3 to ZIP
- No disk I/O bottleneck

---

## 📋 Configuration Steps

### Step 1: Queue Worker Configuration

**For production, start queue worker with extended timeout:**

```bash
# Terminal/Console - start queue worker
php artisan queue:work --timeout=7200 --memory=2048
```

**Parameters:**
- `--timeout=7200`: Max 2 hours per job
- `--memory=2048`: 2GB PHP memory allocation per worker

### Step 2: Environment Variables (Optional)

Add to `.env` for larger operations:

```env
# Queue Configuration
QUEUE_DRIVER=redis  # or database (avoid sync in production)
DB_QUEUE_RETRY_AFTER=900  # 15 minutes retry

# PHP Settings (commented - set in job code instead)
# PHP_MEMORY_LIMIT=2048M
# PHP_MAX_EXECUTION_TIME=7200
```

### Step 3: Verify S3 Configuration

Ensure each tenant has proper S3 config:
- `aws_access_key_id`
- `aws_secret_access_key`
- `aws_region`
- `aws_bucket_name`
- `aws_endpoint` (optional, for custom S3)
- `use_path_style_endpoint` (boolean)

---

## 🔍 Monitoring Large Backups

### 1. **Check Backup Progress**

From dashboard UI or API:
```bash
GET /api/backups/{id}/status
```

Returns:
- `progress`: 0-100%
- `message`: Current operation
- `status`: processing/completed/failed

### 2. **Monitor Queue**

```bash
# View pending jobs
php artisan queue:failed

# List failed jobs with error details
php artisan queue:failed --show

# Retry failed backup
php artisan queue:retry {job-id}
```

### 3. **Check Logs**

```bash
tail -f storage/logs/laravel.log | grep -i "backup\|stream"
```

Look for:
- ✅ "Dosya başarıyla ZIP'e eklendi" (Success)
- ❌ "Dosya stream hatası" (Failed)
- ⏱️ Timeout values (debug info)

### 4. **Monitor Disk Space**

Ensure `/storage/app/backup-temp/` has sufficient free space:
```bash
# Check available space
df -h /path/to/storage/app/backup-temp

# Should be: max file size × 2 at minimum
# For 20 GB file: need 40 GB free space (S3 stream + ZIP output)
```

---

## 📊 Performance Expectations

| Data Size | Processing Time | Memory Used | Disk Required |
|-----------|-----------------|-------------|---------------|
| 1 GB      | 15-20 min       | 2 GB        | 2 GB          |
| 5 GB      | 45-60 min       | 2 GB        | 5 GB          |
| 10 GB     | 90-120 min      | 2 GB        | 10 GB         |
| 20 GB     | 3-4 hours       | 2 GB        | 20 GB         |

**Notes:**
- Times depend on: network speed, S3 latency, disk I/O
- Memory stays at 2GB max (streaming architecture)
- Disk space = backup size + temp overhead (minimal)

---

## 🛠️ Troubleshooting

### Issue: "Timeout waiting for..."

**Solution:** Increase timeout or split backup into smaller batches
```bash
php artisan queue:work --timeout=10800  # 3 hours
```

### Issue: "Out of memory"

**Solution:** Memory limit is already at 2GB max. Check:
1. Other jobs running simultaneously
2. Server has enough RAM (≥4GB recommended)
3. No memory leaks in custom code

### Issue: Partial file downloaded

**Solution:** Already fixed! System now:
1. Gets file size from S3 before download
2. Compares downloaded size vs S3 size
3. Retries if size mismatch
4. Logs detailed error info

### Issue: "Interrupted" backup

**Solution:** Check:
1. Network interruption logs
2. S3 connectivity: `AWS_ENDPOINT` configured correctly
3. Credentials have `GetObject` permission
4. IAM policy allows `s3:GetObject` action

---

## 🔐 Security Notes

1. **Encrypted Backups:** Supported with AES-256
2. **Signed S3 URLs:** 30-minute validity
3. **Credentials:** Stored per-tenant in S3Config table
4. **Temporary Files:** Auto-cleaned after backup
5. **Access Control:** Tenant isolation enforced

---

## 📝 Code Locations

Key files modified for large file support:

1. **TenantBackupService.php**
   - Line 265: 2GB memory limit
   - Line 313: Batch size = 1
   - Line 337-395: Stream-based processing
   - Line 342-344: Adaptive timeout logic

2. **CreateTenantBackupJob.php**
   - Line 34: 2GB memory limit

3. **BackupTenantJob.php**
   - Line 37: 2GB memory limit

4. **SystemBackupController.php**
   - Line 54: 2GB memory limit

---

## ✅ Testing Checklist

- [ ] Test with 500 MB file → Should complete in <10 minutes
- [ ] Test with 5 GB file → Should complete in <1 hour
- [ ] Check logs for no partial downloads
- [ ] Verify ZIP integrity after download
- [ ] Test password-protected backup
- [ ] Test with slow network (simulate timeout recovery)
- [ ] Monitor memory during 20 GB backup
- [ ] Verify temp files cleaned up after completion

---

## 🚀 Production Deployment

1. **Update queue worker startup:**
   ```bash
   # supervisor or systemd
   php artisan queue:work --timeout=7200 --memory=2048
   ```

2. **Ensure storage path exists:**
   ```bash
   mkdir -p storage/app/backup-temp
   chmod 777 storage/app/backup-temp
   ```

3. **Monitor first backup:**
   - Watch logs in real-time
   - Check memory usage
   - Verify completion

4. **Set up backup cron (optional):**
   ```bash
   # Schedule auto-backup every week
   php artisan schedule:run >> /dev/null 2>&1
   ```

---

For questions or issues, check logs at `storage/logs/laravel.log`
