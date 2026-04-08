import type { Quadrant } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const VALID_QUADRANTS: Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export function validateTaskInput(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: { _form: 'Invalid input' } };
  }

  const data = input as Record<string, unknown>;

  // Req 2.2, 2.8: title required, 1–255 chars, not whitespace-only
  const title = data.title;
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (title.trim().length > 255) {
    errors.title = 'Title must be 255 characters or fewer';
  }

  // Req 2.3: description optional, ≤ 2000 chars
  const description = data.description;
  if (description !== undefined && description !== null && description !== '') {
    if (typeof description !== 'string' || description.length > 2000) {
      errors.description = 'Description must be 2000 characters or fewer';
    }
  }

  // Req 2.5: valid quadrant required
  const quadrant = data.quadrant;
  if (!quadrant || !VALID_QUADRANTS.includes(quadrant as Quadrant)) {
    errors.quadrant = 'A valid quadrant (Q1, Q2, Q3, or Q4) is required';
  }

  // Req 2.6, 2.7, 4.3: urgency_threshold_days ≥ 1 requires deadline
  const urgencyThreshold = data.urgency_threshold_days;
  const deadline = data.deadline;

  if (urgencyThreshold !== undefined && urgencyThreshold !== null) {
    if (typeof urgencyThreshold !== 'number' || !Number.isInteger(urgencyThreshold) || urgencyThreshold < 1) {
      errors.urgency_threshold_days = 'Urgency threshold must be a whole number of at least 1 day';
    } else if (!deadline) {
      errors.urgency_threshold_days = 'A deadline is required when an urgency threshold is set';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// Validates a partial task update (PATCH). Only validates fields that are present.
// Title and quadrant, if provided, must still satisfy the same rules.
// urgency_threshold_days still requires a deadline (either in the patch or implied by clearing deadline).
export function validatePartialTaskInput(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: { _form: 'Invalid input' } };
  }

  const data = input as Record<string, unknown>;

  // Title: if provided, must be 1–255 non-whitespace chars
  if ('title' in data) {
    const title = data.title;
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (title.trim().length > 255) {
      errors.title = 'Title must be 255 characters or fewer';
    }
  }

  // Description: if provided (and non-empty), must be ≤ 2000 chars
  if ('description' in data) {
    const description = data.description;
    if (description !== undefined && description !== null && description !== '') {
      if (typeof description !== 'string' || description.length > 2000) {
        errors.description = 'Description must be 2000 characters or fewer';
      }
    }
  }

  // Quadrant: if provided, must be valid
  if ('quadrant' in data) {
    const quadrant = data.quadrant;
    if (!quadrant || !VALID_QUADRANTS.includes(quadrant as Quadrant)) {
      errors.quadrant = 'A valid quadrant (Q1, Q2, Q3, or Q4) is required';
    }
  }

  // urgency_threshold_days: if provided (and non-null), must be ≥ 1 integer and a deadline must also be present
  if ('urgency_threshold_days' in data) {
    const urgencyThreshold = data.urgency_threshold_days;
    if (urgencyThreshold !== undefined && urgencyThreshold !== null) {
      if (typeof urgencyThreshold !== 'number' || !Number.isInteger(urgencyThreshold) || urgencyThreshold < 1) {
        errors.urgency_threshold_days = 'Urgency threshold must be a whole number of at least 1 day';
      } else {
        // A deadline must be present in the patch (or not being cleared)
        const deadline = data.deadline;
        if (deadline === null || deadline === undefined || deadline === '') {
          errors.urgency_threshold_days = 'A deadline is required when an urgency threshold is set';
        }
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
