 import React from 'react';

// Tipos de validación
export type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

// Validadores específicos
export const validators = {
  // Validación de email
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    return {
      isValid,
      errors: isValid ? [] : ['El email no tiene un formato válido']
    };
  },

  // Validación de teléfono
  phone: (value: string): ValidationResult => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const isValid = phoneRegex.test(value) && value.length >= 8;
    return {
      isValid,
      errors: isValid ? [] : ['El teléfono debe tener al menos 8 dígitos']
    };
  },

  // Validación de precio
  price: (value: number): ValidationResult => {
    const isValid = value > 0 && value <= 1000000;
    return {
      isValid,
      errors: isValid ? [] : ['El precio debe estar entre 1 y 1,000,000']
    };
  },

  // Validación de duración
  duration: (value: number): ValidationResult => {
    const isValid = value >= 15 && value <= 480; // 15 min a 8 horas
    return {
      isValid,
      errors: isValid ? [] : ['La duración debe estar entre 15 minutos y 8 horas']
    };
  },

  // Validación de fecha futura
  futureDate: (value: string): ValidationResult => {
    const date = new Date(value);
    const now = new Date();
    const isValid = date > now;
    return {
      isValid,
      errors: isValid ? [] : ['La fecha debe ser futura']
    };
  },

  // Validación de fecha no muy lejana
  reasonableFutureDate: (value: string): ValidationResult => {
    const date = new Date(value);
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const isValid = date > now && date <= oneYearFromNow;
    return {
      isValid,
      errors: isValid ? [] : ['La fecha debe estar dentro del próximo año']
    };
  },

  // Validación de nombre
  name: (value: string): ValidationResult => {
    const isValid = value.trim().length >= 2 && value.trim().length <= 100;
    return {
      isValid,
      errors: isValid ? [] : ['El nombre debe tener entre 2 y 100 caracteres']
    };
  },

  // Validación de descuento
  discount: (value: number, listPrice: number): ValidationResult => {
    const isValid = value >= 0 && value <= listPrice;
    return {
      isValid,
      errors: isValid ? [] : ['El descuento no puede ser mayor al precio de lista']
    };
  },

  // Validación de horario disponible
  timeSlot: (startTime: string, duration: number, existingAppointments: any[]): ValidationResult => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    
    const hasConflict = existingAppointments.some(appointment => {
      const appStart = new Date(appointment.startDateTime);
      const appEnd = new Date(appStart.getTime() + appointment.durationMin * 60000);
      
      return (start < appEnd && end > appStart);
    });

    return {
      isValid: !hasConflict,
      errors: hasConflict ? ['Este horario ya está ocupado'] : []
    };
  }
};

// Función para validar múltiples campos
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule<any>[]>
): ValidationResult {
  const errors: string[] = [];

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        errors.push(`${field}: ${rule.message}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Hook para validación en tiempo real
export function useValidation<T extends Record<string, any>>(
  initialData: T,
  rules: Record<keyof T, ValidationRule<any>[]>
) {
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<Record<keyof T, string[]>>({} as any);
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as any);

  const validateField = React.useCallback((field: keyof T, value: any) => {
    const fieldRules = rules[field] || [];
    const fieldErrors: string[] = [];

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        fieldErrors.push(rule.message);
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors
    }));

    return fieldErrors.length === 0;
  }, [rules]);

  const handleChange = React.useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  const handleBlur = React.useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  }, [validateField, data]);

  const validateAll = React.useCallback(() => {
    const allErrors: Record<keyof T, string[]> = {} as any;
    let isValid = true;

    for (const field of Object.keys(rules) as (keyof T)[]) {
      const fieldErrors: string[] = [];
      const fieldRules = rules[field];

      for (const rule of fieldRules) {
        if (!rule.validate(data[field])) {
          fieldErrors.push(rule.message);
          isValid = false;
        }
      }

      allErrors[field] = fieldErrors;
    }

    setErrors(allErrors);
    return isValid;
  }, [data, rules]);

  return {
    data,
    errors,
    touched,
    isValid: Object.values(errors).every(fieldErrors => fieldErrors.length === 0),
    handleChange,
    handleBlur,
    validateAll,
    setData
  };
}
