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

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-entry" element={<NewEntry />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/debug" element={<Debug />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </LocalizationProvider>
  );
}

export default App; 