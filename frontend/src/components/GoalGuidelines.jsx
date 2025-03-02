import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';

const GoalGuidelines = () => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Setting Realistic Goals
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weight Loss
              </Typography>
              <Typography variant="body2">
                • Aim for 0.5-1 kg per week for sustainable weight loss
                <br />
                • This equals about 2-4 kg per month
                <br />
                • Faster weight loss may be harder to maintain
                <br />
                • Consider your starting point and lifestyle
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Body Fat Reduction
              </Typography>
              <Typography variant="body2">
                • Aim to lose 0.5-1% body fat per month
                <br />
                • Healthy ranges: 10-20% for men, 18-28% for women
                <br />
                • Athletes may have lower percentages
                <br />
                • Body fat loss slows as you get leaner
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Muscle Mass
              </Typography>
              <Typography variant="body2">
                • Advanced: up to 1-1.5 kg per month
                <br />
                • Intermediate: 0.5-1 kg per month
                <br />
                • Beginners: 0.25-0.5 kg per month
                <br />
                • Requires resistance training and adequate protein
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GoalGuidelines; 