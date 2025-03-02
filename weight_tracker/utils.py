import numpy as np
from weight_tracker.config import logger

def calculate_body_fat_percentage(weight, neck, belly, height=185, gender='male', hip=None):
    """
    Calculate body fat percentage using the US Navy method.
    Default height is 185cm, and default gender is male.
    For a more accurate calculation, the app should collect height and gender from the user.
    Hip measurement is required for females for accurate calculation.
    """
    if not all([weight, neck, belly]):
        return None
    
    # Convert measurements from cm to inches
    neck_inches = neck / 2.54
    belly_inches = belly / 2.54
    height_inches = height / 2.54
    
    if gender.lower() == 'male':
        body_fat = 86.010 * np.log10(belly_inches - neck_inches) - 70.041 * np.log10(height_inches) + 36.76
    else:  # female
        # For females, we need hip measurement for accurate calculation
        if not hip:
            # Fallback to simplified formula if hip measurement is not available
            body_fat = 163.205 * np.log10(belly_inches - neck_inches) - 97.684 * np.log10(height_inches) - 78.387
        else:
            hip_inches = hip / 2.54
            body_fat = 163.205 * np.log10(belly_inches + hip_inches - neck_inches) - 97.684 * np.log10(height_inches) - 104.912
    
    # Ensure the result is within reasonable bounds
    return max(min(body_fat, 50), 3)

def calculate_muscle_mass(weight, fat_percentage):
    """
    Estimate muscle mass based on weight and body fat percentage.
    This is a simplified calculation. For more accuracy, we would need additional measurements.
    """
    if not all([weight, fat_percentage]):
        return None
    
    # First, calculate fat mass
    fat_mass = weight * (fat_percentage / 100)
    
    # Estimate essential body mass (bones, organs, etc.) - very approximate
    essential_mass = weight * 0.2
    
    # Muscle mass is what remains
    muscle_mass = weight - fat_mass - essential_mass
    
    return max(muscle_mass, 0)  # Ensure we don't return negative values
