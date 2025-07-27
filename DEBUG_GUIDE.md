# Weight Tracker Debug Guide

This guide provides comprehensive instructions for debugging and maintaining the Weight Tracker application in development and production environments.

## Debug Tools Overview

The Weight Tracker application includes several built-in debug and maintenance tools:

1. **Debug Mode**: Enables detailed logging and access to debug API endpoints
2. **Database Maintenance Endpoints**: Monitor and fix database issues in production
3. **Frontend Debug Panel**: UI component that displays debug information
4. **Health Check Endpoints**: Monitor application status
5. **Comprehensive Logging**: Track all database operations and errors

## Starting the Application in Debug Mode

### Development Mode

#### Using the Shell Script (macOS/Linux):
```bash
chmod +x start.sh  # Make executable (first time only)
./start.sh --debug
```

#### Manual Setup:
1. Set environment variable:
   ```bash
   export FLASK_ENV=development
   ```

2. Start the backend:
   ```bash
   python run.py
   ```

3. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   PORT=3939 npm start
   ```

#### Windows Manual Setup:
```cmd
set FLASK_ENV=development
python run.py
```

Then in a separate command prompt:
```cmd
cd frontend
set PORT=3939
npm start
```

## Debug API Endpoints

The application provides several debug endpoints for monitoring and maintenance:

### Health Check
```
GET /api/debug/health
```
Returns basic health information:
- Database connection status
- System resource usage (CPU, memory)
- Environment information
- Debug mode status

### Database Information
```
GET /api/debug/database-info
```
Returns comprehensive database status:
- Database type (SQLite/PostgreSQL)
- Table counts for all entities
- Maximum IDs in each table
- PostgreSQL sequence status (if applicable)
- Sequence synchronization status

### Fix Database Sequences (PostgreSQL only)
```
POST /api/debug/fix-sequences
```
Automatically fixes PostgreSQL sequence synchronization issues that cause duplicate key violations.

## Accessing Debug Information

### Frontend Debug Panel

1. Open the application in your browser
2. Open developer console (F12)
3. Enable debug mode:
   ```javascript
   localStorage.setItem('debugMode', 'true')
   ```
4. Refresh the page
5. Click the "Debug" tab in the navigation

The Debug Panel provides:
- Server status information
- Real-time application logs
- Environment details
- Database status (if connected)

### Command Line Testing

You can test debug endpoints directly:

```bash
# Health check
curl http://localhost:5000/api/debug/health

# Database info
curl http://localhost:5000/api/debug/database-info

# Fix sequences (if needed)
curl -X POST http://localhost:5000/api/debug/fix-sequences
```

## Production Debugging

### Database Sequence Issues

**Symptom**: "duplicate key value violates unique constraint" errors

**Cause**: PostgreSQL sequences out of sync with actual data

**Solution**:
1. Check status: Visit `https://your-app-url.com/api/debug/database-info`
2. If any table shows "needs_fix": true, run the fix:
   ```bash
   curl -X POST https://your-app-url.com/api/debug/fix-sequences
   ```

### Authentication Issues

**Symptom**: Users can't log in or stay logged in

**Causes & Solutions**:
- Missing `SECRET_KEY`: Set in environment variables
- Session expired: Normal behavior, users need to log in again
- Database connection issues: Check `DATABASE_URL`

### Database Connection Problems

**Symptoms**: 
- 500 errors on data operations
- "database is locked" (SQLite)
- Connection timeout errors (PostgreSQL)

**Solutions**:
1. Check database URL: Verify `DATABASE_URL` environment variable
2. For PostgreSQL: Ensure database service is running
3. For SQLite: Check file permissions and disk space
4. Check logs for specific error messages

## Logging and Monitoring

### Application Logs

Logs are stored in `logs/app.log` and include:
- All database operations (with user and record IDs)
- Authentication events
- Error messages with stack traces
- API request information

### Enable SQL Query Logging (Production)

Set environment variable:
```
LOG_SQL=true
```

This logs all SQL queries to help debug database issues. **Disable in production** for performance.

### Log Examples

```
2024-01-15 10:30:45 - INFO - New entry added: ID=123, weight=75.5kg, user_id=1, account_id=5
2024-01-15 10:31:20 - ERROR - Duplicate key error: ID=4 already exists
2024-01-15 10:32:00 - INFO - Sequence fixed: entry_id_seq set to 125
```

## Troubleshooting Common Issues

### 1. Duplicate Key Violations

**Error**: `duplicate key value violates unique constraint "entry_pkey"`

**Solution**: Use database sequence fix endpoints (see above)

### 2. User Authentication Failures

**Symptoms**: Login doesn't work, users logged out unexpectedly

**Debug steps**:
1. Check `SECRET_KEY` is set in production
2. Verify database connection
3. Check browser console for errors
4. Review application logs for authentication errors

### 3. Database Migration Issues

**Symptoms**: Table doesn't exist, column not found

**Solutions**:
1. Ensure `db.create_all()` ran successfully during deployment
2. Check if database URL is correct
3. For PostgreSQL: Verify database exists and is accessible
4. Check deployment logs for table creation errors

### 4. Frontend-Backend Connection Issues

**Symptoms**: API calls fail, CORS errors

**Debug steps**:
1. Verify backend is running and accessible
2. Check API endpoints return data:
   ```bash
   curl https://your-app-url.com/api/debug/health
   ```
3. Review browser network tab for failed requests
4. Check for CORS configuration issues

### 5. Build/Deployment Failures

**Common causes**:
- Node.js version incompatibility
- Missing dependencies
- Environment variables not set
- Database connection failures

**Solutions**:
1. Check build logs for specific errors
2. Verify all dependencies in `requirements.txt` and `package.json`
3. Ensure environment variables are properly set
4. Test database connection during build

## Environment Variables

### Development
```bash
FLASK_ENV=development      # Enables debug mode
LOG_SQL=true              # Log all SQL queries (optional)
DATABASE_URL=sqlite:///weight_tracker.db  # Local database
```

### Production
```bash
FLASK_ENV=production      # Disables debug mode
SECRET_KEY=your-secret-key-here  # Required for sessions
DATABASE_URL=postgresql://...    # Production database
LOG_SQL=false            # Disable SQL logging for performance
```

## Advanced Debugging

### Direct Database Access

For PostgreSQL production databases:
1. Get database URL from Render dashboard
2. Connect using TablePlus, pgAdmin, or psql
3. Run diagnostic queries:
   ```sql
   -- Check table status
   SELECT table_name, 
          (SELECT COUNT(*) FROM entry) as entry_count,
          (SELECT MAX(id) FROM entry) as max_entry_id,
          (SELECT last_value FROM entry_id_seq) as sequence_value;
   
   -- Fix sequence manually if needed
   SELECT setval('entry_id_seq', (SELECT MAX(id) FROM entry) + 1);
   ```

### Application Performance

Monitor resource usage:
- Check memory consumption in logs
- Monitor API response times
- Use browser dev tools to profile frontend performance
- Enable SQL logging temporarily to identify slow queries

## Getting Help

1. **Check logs first**: `logs/app.log` contains detailed error information
2. **Use debug endpoints**: Health and database-info provide system status
3. **Review this guide**: Most issues have solutions documented here
4. **Check deployment logs**: Platform-specific logs show build/runtime issues

For persistent issues, gather:
- Application logs
- Browser console errors
- Database status from debug endpoints
- Environment variable configuration
- Steps to reproduce the problem 