# Weight Tracker App

A beautiful and simple web application to track your weight, body fat, and muscle mass over time. Set goals, visualize your progress, and gain insights into your fitness journey.

## Features

- Track key body metrics: weight, body fat percentage, muscle mass, and body measurements
- Set goals with target dates
- Visualize your progress with interactive charts
- Compare your actual progress against required progress to meet goals
- Store all data locally in an SQLite database for privacy

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

## Setup

### Backend Setup

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

### Frontend Setup

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
   npm start
   ```

4. Open your browser and visit `http://localhost:3939`

## How to Use

1. Enter your measurements in the "New Entry" tab
2. Set your goals in the "Goals" tab
3. View your progress and insights in the "Dashboard" tab

## Technologies Used

- Backend: Flask, SQLAlchemy, SQLite
- Frontend: React, Chart.js, Material-UI