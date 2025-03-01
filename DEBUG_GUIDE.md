# Weight Tracker Debug Guide

This guide provides instructions on how to use the debug tools for the Weight Tracker application.

## Debug Tools Overview

The Weight Tracker application includes several debug tools to help diagnose and fix issues:

1. **Debug Mode**: Enables detailed logging and access to the debug API endpoints
2. **Debug API Endpoints**: Provides server status, logs, and other diagnostic information
3. **Debug Panel**: A UI component that displays debug information
4. **Restart Utility**: Helps stop and restart both server and client components

## Starting the Application in Debug Mode

### On macOS/Linux:

You can use either of these methods:

1. Using the Python script:
   ```bash
   python run_debug.py
   ```

2. Using the shell script:
   ```bash
   chmod +x run_debug.sh  # Make executable (first time only)
   ./run_debug.sh
   ```

### On Windows:

```cmd
run_debug.bat
```

## Using the Restart Utility

The restart utility helps you stop and restart both the server and client components:

```bash
python restart_all.py
```

Follow the prompts to:
- Stop running server processes
- Stop running client processes
- Start the server in debug mode
- Start the client

## Accessing Debug Information

Once the application is running in debug mode:

1. Open the application in your browser (typically at http://localhost:3000)
2. Click on the "Debug" button in the navigation bar to open the Debug Panel
3. The Debug Panel provides:
   - Server status
   - Application logs
   - Environment information
   - API request history

## Troubleshooting Common Issues

### 403 Forbidden Error on Debug Endpoints

If you see a 403 Forbidden error when accessing debug endpoints:

1. Ensure the server is running in debug mode
2. Check the server logs to confirm `DEBUG_MODE=true` is set
3. Restart the server using one of the debug scripts

### Missing Logs

If logs are not appearing in the Debug Panel:

1. Check that the `logs` directory exists in the project root
2. Ensure the server has write permissions to the logs directory
3. Check the server console for any error messages related to logging

### Client-Server Connection Issues

If the client cannot connect to the server:

1. Ensure both client and server are running
2. Check that the client is configured to use the correct server URL
3. Look for CORS-related errors in the browser console

## Environment Variables

The debug tools use the following environment variables:

- `DEBUG_MODE`: Set to `true` to enable debug mode
- `LOG_LEVEL`: Controls the verbosity of logging (default: `DEBUG` when in debug mode)
- `LOG_FILE`: Path to the log file (default: `logs/app.log`)

## Additional Resources

For more information on debugging Flask applications, see:
- [Flask Debugging Documentation](https://flask.palletsprojects.com/en/2.3.x/debugging/)
- [Python Logging Documentation](https://docs.python.org/3/library/logging.html) 