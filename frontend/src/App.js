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
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-entry" element={<NewEntry />} />
              <Route path="/edit-entry/:entryId" element={<EditEntry />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings />} />
              {isDebugMode && <Route path="/debug" element={<Debug />} />}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/new" element={<NewProfile />} />
              <Route path="/profile/edit/:userId" element={<EditProfile />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </LocalizationProvider>
  );
}

export default App;