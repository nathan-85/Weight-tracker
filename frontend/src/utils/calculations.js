import { differenceInDays } from 'date-fns';

export const calculateMuscleMass = (weight, fatPercentage) => {
  if (!weight || !fatPercentage) return null;
  
  const weightNum = parseFloat(weight);
  const fatPercentageNum = parseFloat(fatPercentage);
  
  const fatMass = weightNum * (fatPercentageNum / 100);
  const essentialMass = weightNum * 0.2; // Estimate for bones, organs, etc.
  const muscleMass = weightNum - fatMass - essentialMass;
  
  return Math.max(muscleMass, 0);
};

export const getWeeklyChange = (current, target, date) => {
  if (!current || !target || !date) return null;
  
  const daysRemaining = differenceInDays(date, new Date());
  if (daysRemaining <= 0) return null;
  
  // Calculate daily change and multiply by 7 for weekly
  const dailyChange = (parseFloat(target) - current) / daysRemaining;
  const weeklyChange = dailyChange * 7;
  return weeklyChange.toFixed(2);
}; 