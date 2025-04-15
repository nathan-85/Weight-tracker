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

def infer_belly_circumference(fat_percentage, neck, height, gender='male', hip=None):
    """
    Infer belly circumference (in cm) from body fat percentage using the US Navy method.
    Requires neck circumference and height (in cm).
    Hip measurement (in cm) is required for females for accurate inference.
    Returns None if required measurements are missing or if calculation is not possible.
    """
    if not all([fat_percentage, neck, height]):
        logger.warning("Missing required inputs for infer_belly_circumference.")
        return None

    # Convert measurements from cm to inches
    neck_inches = neck / 2.54
    height_inches = height / 2.54

    try:
        if gender.lower() == 'male':
            # Reverse male formula: body_fat = 86.010 * log10(belly - neck) - 70.041 * log10(height) + 36.76
            log_arg = (fat_percentage - 36.76 + 70.041 * np.log10(height_inches)) / 86.010
            belly_minus_neck = 10**log_arg
            belly_inches = belly_minus_neck + neck_inches
        else:  # female
            if not hip:
                logger.warning("Hip measurement is required for accurate female belly inference. Using simplified formula.")
                # Reverse simplified female formula: body_fat = 163.205 * log10(belly - neck) - 97.684 * log10(height) - 78.387
                log_arg = (fat_percentage + 78.387 + 97.684 * np.log10(height_inches)) / 163.205
                belly_minus_neck = 10**log_arg
                belly_inches = belly_minus_neck + neck_inches
            else:
                hip_inches = hip / 2.54
                # Reverse full female formula: body_fat = 163.205 * log10(belly + hip - neck) - 97.684 * log10(height) - 104.912
                log_arg = (fat_percentage + 104.912 + 97.684 * np.log10(height_inches)) / 163.205
                belly_plus_hip_minus_neck = 10**log_arg
                belly_inches = belly_plus_hip_minus_neck + neck_inches - hip_inches
        
        # Convert back to cm
        belly_cm = belly_inches * 2.54
        
        # Add some sanity checks - belly circumference shouldn't be smaller than neck or excessively large
        if belly_cm < neck or belly_cm > 200: 
            logger.warning(f"Inferred belly circumference ({belly_cm:.1f} cm) seems unrealistic.")
            # Return None or handle as an edge case? For now, return calculated value.
            
        return round(belly_cm, 1)

    except (ValueError, OverflowError) as e:
        logger.error(f"Error calculating inferred belly circumference: {e}")
        return None
