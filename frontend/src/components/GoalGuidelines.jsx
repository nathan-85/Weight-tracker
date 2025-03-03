import React from 'react';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  Divider
} from '@mui/material';
import {
  FitnessCenter,
  MonitorWeight,
  ShowChart
} from '@mui/icons-material';

const GoalGuidelines = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
          fontWeight: 'bold'
        }}
      >
        Setting Realistic Goals
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
        <ListItem>
          <ListItemIcon>
            <MonitorWeight color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Weight Loss"
            secondary="Aim for 0.5-1 kg per week (2-4 kg per month) for sustainable weight loss. Faster weight loss may be harder to maintain."
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <ShowChart color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Body Fat Reduction"
            secondary="Target 0.5-1% body fat loss per month. Healthy ranges: 10-20% for men, 18-28% for women. Athletes may have lower percentages."
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <FitnessCenter color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Muscle Mass"
            secondary="Monthly gains: Advanced (1-1.5 kg), Intermediate (0.5-1 kg), Beginners (0.25-0.5 kg). Requires resistance training and adequate protein."
          />
        </ListItem>
      </List>
    </Box>
  );
};

export default GoalGuidelines; 