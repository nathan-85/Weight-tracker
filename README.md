# Weight Tracker App

A beautiful and simple web application to track your weight, body fat, and muscle mass over time. Set goals, visualize your progress, and gain insights into your fitness journey.

## Features

- Track key body metrics: weight, body fat percentage, muscle mass, and body measurements
- Set goals with target dates
- Visualize your progress with interactive charts
- Compare your actual progress against required progress to meet goals
- Store all data locally in an SQLite database for privacy
- Multi-user support with separate profiles

## Project Structure

The application has been refactored into a modular structure for better maintainability:

```
weight_tracker/
├── __init__.py          # Application factory
├── config.py            # Configuration settings
├── models.py            # Database models
├── utils.py             # Helper functions
└── routes/              # API routes
    ├── __init__.py      # Blueprint registration
    ├── entries.py       # Weight entry endpoints
    ├── goals.py         # Goal tracking endpoints  
    ├── progress.py      # Progress calculation endpoints
    ├── users.py         # User management endpoints
    └── debug.py         # Debug and status endpoints
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
    │   └── UserSelector.jsx
    ├── contexts/        # React context providers
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
    │   ├── NewEntry.js
    │   ├── NewProfile.js
    │   ├── Profile.js
    │   ├── Progress.js
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

1. If tracking multiple users, create profiles in the "Profile" tab using "New Profile".

2. Select the current user from the user selector in the header.

3. Enter your measurements in the "New Entry" tab.

4. Set your goals in the "Goals" tab.

5. View your progress charts and insights in the "Progress" and "Dashboard" tabs.

6. Adjust application settings in the "Settings" tab.

7. Edit existing entries or profiles as needed using the edit options.

## Debug Mode

The backend debug mode is enabled by default (DEBUG_MODE=True in config.py), providing detailed logging and access to debug API endpoints.

For the frontend debug panel:

1. Open the browser developer console (F12).

2. Execute: `localStorage.setItem('debugMode', 'true')`

3. Refresh the page.

4. The "Debug" tab will appear in the navigation, showing server status, logs, environment info, etc.

Application logs are stored in `logs/app.log`.

For additional troubleshooting, see DEBUG_GUIDE.md (note: some scripts mentioned may not be present in the current version).

## Technologies Used

- Backend: Flask, SQLAlchemy, SQLite
- Frontend: React, Chart.js, Material-UI