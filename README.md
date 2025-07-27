# Weight Tracker App

A beautiful and simple web application to track your weight, body fat, and muscle mass over time. Set goals, visualize your progress, and gain insights into your fitness journey.

## Features

- Track key body metrics: weight, body fat percentage, muscle mass, and body measurements
- Set goals with target dates
- Visualize your progress with interactive charts
- Compare your actual progress against required progress to meet goals
- **Multi-database support**: SQLite for local development, PostgreSQL for production
- **User authentication and authorization** with secure account management
- Multi-user support with separate profiles per account
- **Built-in database maintenance tools** for production deployments
- Comprehensive error handling and logging

## Project Structure

The application has been refactored into a modular structure for better maintainability:

```
weight_tracker/
├── __init__.py          # Application factory
├── config.py            # Configuration settings
├── models.py            # Database models (User, Entry, Goal, Account)
├── utils.py             # Helper functions
└── routes/              # API routes
    ├── __init__.py      # Blueprint registration
    ├── auth.py          # Authentication endpoints
    ├── entries.py       # Weight entry endpoints
    ├── goals.py         # Goal tracking endpoints  
    ├── progress.py      # Progress calculation endpoints
    ├── users.py         # User management endpoints
    └── debug.py         # Debug and database maintenance endpoints
```

### Frontend Structure

```
frontend/
├── package.json         # Dependencies and scripts
├── public/
│   ├── index.html       # Main HTML template
│   └── manifest.json    # PWA manifest
└── src/
    ├── App.js           # Main application component
    ├── index.js         # Entry point
    ├── index.css        # Global styles
    ├── components/      # Reusable UI components
    │   ├── GoalForm.jsx
    │   ├── GoalGuidelines.jsx
    │   ├── GoalTable.jsx
    │   ├── Header.js
    │   ├── MobileNav.jsx
    │   ├── ProtectedRoute.js
    │   └── UserSelector.jsx
    ├── contexts/        # React context providers
    │   ├── AuthContext.js
    │   ├── SettingsContext.js
    │   ├── ThemeContext.js
    │   └── UserContext.js
    ├── hooks/           # Custom React hooks
    │   ├── useGoals.js
    │   ├── useMeasurements.js
    │   └── useUsers.js
    ├── pages/           # Page components
    │   ├── Dashboard.js
    │   ├── Debug.js
    │   ├── EditEntry.js
    │   ├── EditProfile.js
    │   ├── Goals.js
    │   ├── Login.js
    │   ├── NewEntry.js
    │   ├── NewProfile.js
    │   ├── Profile.js
    │   ├── Progress.js
    │   ├── Register.js
    │   └── Settings.js
    ├── services/        # API services
    │   └── api.js
    └── utils/           # Utility functions
        └── calculations.js
```

## Setup

### Quick Start

The easiest way to start the application is to use the provided startup script:

- **On macOS/Linux**: 
  ```
  chmod +x start.sh  # Make executable (first time only)
  ./start.sh
  ```

This script will start both the backend server and frontend client automatically. Options include --debug, --backend-only, --frontend-only, --restart.

Note: For Windows, use the manual setup below as there is no bat script currently.

### Manual Setup

If you prefer to set up the components separately, follow these steps:

#### Backend Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```
   python run.py
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   PORT=3939 npm start
   ```

4. Open your browser and visit `http://localhost:3939`

## How to Use

1. **Create an account** using the register page, or log in if you already have one.

2. **Create user profiles** in the "Profile" tab using "New Profile" if tracking multiple people.

3. **Select the current user** from the user selector in the header.

4. **Enter your measurements** in the "New Entry" tab.

5. **Set your goals** in the "Goals" tab.

6. **View your progress** charts and insights in the "Progress" and "Dashboard" tabs.

7. **Adjust application settings** in the "Settings" tab.

8. **Edit existing entries or profiles** as needed using the edit options.

## Debug Mode & Database Maintenance

The application includes comprehensive debugging and database maintenance tools:

### Debug Mode

Backend debug mode provides detailed logging and access to debug API endpoints. Set `FLASK_ENV=development` to enable.

For the frontend debug panel:
1. Open the browser developer console (F12)
2. Execute: `localStorage.setItem('debugMode', 'true')`
3. Refresh the page
4. The "Debug" tab will appear in the navigation

### Database Maintenance (Production)

**Important**: If you encounter duplicate key errors in production, use these endpoints:

#### Check Database Status
```
GET /api/debug/database-info
```
Returns current database status, table counts, and sequence information.

#### Fix Database Sequences
```
POST /api/debug/fix-sequences
```
Automatically fixes PostgreSQL sequence issues that cause duplicate key violations.

#### Health Check
```
GET /api/debug/health
```
Basic health and connectivity check.

**Access via browser**: Visit `https://your-app-url.com/api/debug/database-info` to check status, then use developer console or curl to POST to fix-sequences if needed.

Application logs are stored in `logs/app.log`.

## Technologies Used

- **Backend**: Flask, SQLAlchemy, PostgreSQL/SQLite, Flask-Login
- **Frontend**: React, Chart.js, Material-UI
- **Authentication**: Session-based with secure password hashing
- **Database**: SQLite (development), PostgreSQL (production)

## Deployment to Render.com

This application can be deployed to Render.com as a single web service that serves both the backend API and the built frontend static files.

### Prerequisites

- Push your repository to GitHub or another git provider supported by Render.
- Create a free account on [Render.com](https://render.com).

### Deployment Steps

If you encounter an error about missing Dockerfile, ensure you select "Python" as the Runtime. If you prefer to use Docker, see the Docker alternative below.

1. In the Render dashboard, click "New" > "Web Service".
2. Connect your repository and select the branch (e.g., main).
3. Configure the service:
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt && cd frontend && npm install && npm run build`
   - **Start Command**: `gunicorn -b 0.0.0.0:$PORT weight_tracker:create_app`
4. Set environment variables:
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: `your-secret-key-here` (generate a secure random string)
   - `PYTHON_VERSION`: `3.11.0` (or your preferred version, optional)
5. For database persistence, choose one of the options below.

#### Option 1: SQLite with Persistent Disk (simplest)

- In the service settings, go to "Disks" and add a new disk:
  - Name: `data`
  - Mount Path: `/data`
  - Size: 1 GB (or more if needed)
- Add environment variable:
  - `DATABASE_URL`: `sqlite:////data/weight_tracker.db`

#### Option 2: PostgreSQL (recommended for production)

- In Render, click "New" > "PostgreSQL" to create a new database.
- Once created, copy the **External Database URL** from the database Info tab.
- In your web service environment variables, add:
  - `DATABASE_URL`: `<your-postgres-url>` (paste the URL here)

**Important**: PostgreSQL deployments may occasionally experience sequence synchronization issues. If you encounter duplicate key errors, use the database maintenance endpoints described above.

6. Click "Create Web Service".
7. Once deployed, your app will be available at the provided Render URL.

### Post-Deployment: Database Sequence Maintenance

**If you encounter "duplicate key value violates unique constraint" errors**:

1. Visit `https://your-app-url.onrender.com/api/debug/database-info` to check sequence status
2. If any sequences show "needs_fix": true, run the fix:
   ```bash
   curl -X POST https://your-app-url.onrender.com/api/debug/fix-sequences
   ```
3. Or use browser developer console:
   ```javascript
   fetch('/api/debug/fix-sequences', { method: 'POST' })
     .then(r => r.json())
     .then(data => console.log(data));
   ```

This is a one-time fix that resolves PostgreSQL auto-increment sequence synchronization issues.

### Alternative: Deploy with Docker

If you prefer to use Docker:

```dockerfile
FROM python:3.11-slim

# Install Node.js and npm
RUN apt-get update && apt-get install -y nodejs npm

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Install Python dependencies
RUN pip install -r requirements.txt

# Install frontend dependencies and build
RUN cd frontend && npm install && npm run build

# Expose the port
EXPOSE $PORT

# Run the application
CMD ["gunicorn", "-b", "0.0.0.0:$PORT", "weight_tracker:create_app"]
```

## PostgreSQL Logging on Render

To monitor database operations in your Render logs:

### Enable SQL Query Logging

Add this environment variable in your Render dashboard:
- `LOG_SQL`: Set to `true` to log all SQL queries in the Render logs

### What You'll See

When `LOG_SQL` is enabled, the Render logs will show:
- All SQL queries executed by your application
- Database connection information
- Detailed logs for data modifications (INSERT, UPDATE, DELETE) with record IDs and values

Example log entries:
```
2024-01-15 10:30:45 - INFO - New entry added: ID=123, weight=75.5kg, user_id=1, account_id=5, date=2024-01-15
2024-01-15 10:31:20 - INFO - Entry updated: ID=123, changes=[weight: 75.5 → 74.8]
2024-01-15 10:32:00 - INFO - Goal deleted: ID=45, target_date=2024-06-01, user_id=1
```

### Performance Considerations

- In production, keep `LOG_SQL` set to `false` to avoid performance impact and log clutter
- The application always logs important operations (data adds/updates/deletes) regardless of this setting
- Use `LOG_SQL=true` temporarily when debugging database issues

### Viewing Logs

1. Go to your Render dashboard
2. Select your web service
3. Click on "Logs" in the left sidebar
4. You'll see all application logs including database operations

## Troubleshooting

### Common Issues

**Duplicate Key Violations**: Use the database maintenance endpoints described above.

**Authentication Issues**: Ensure `SECRET_KEY` environment variable is set in production.

**Database Connection Issues**: Check your `DATABASE_URL` environment variable and database service status.

**Build Failures**: Ensure all dependencies in `requirements.txt` and `package.json` are compatible with your Python/Node versions.

For detailed debugging, see `DEBUG_GUIDE.md`.