import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Components
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import Goals from './pages/Goals';
import Progress from './pages/Progress';
import Debug from './pages/Debug';
import Profile from './pages/Profile';
import NewProfile from './pages/NewProfile';
import EditProfile from './pages/EditProfile';
import EditEntry from './pages/EditEntry';
import Settings from './pages/Settings';
import MobileNav from './components/MobileNav';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // Check if debug mode is enabled in localStorage
  const [isDebugMode] = useState(localStorage.getItem('debugMode') === 'true');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header isDebugMode={isDebugMode} />
          <Container component="main" sx={{ flexGrow: 1, py: 3, px: { xs: 2, sm: 3, md: 4 }, maxWidth: '100% !important' }}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/new-entry" element={<ProtectedRoute><NewEntry /></ProtectedRoute>} />
              <Route path="/edit-entry/:entryId" element={<ProtectedRoute><EditEntry /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {isDebugMode && <Route path="/debug" element={<ProtectedRoute><Debug /></ProtectedRoute>} />}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/new" element={<ProtectedRoute><NewProfile /></ProtectedRoute>} />
              <Route path="/profile/edit/:userId" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Container>
          <MobileNav />
        </Box>
      </Router>
    </LocalizationProvider>
  );
}

export default App;