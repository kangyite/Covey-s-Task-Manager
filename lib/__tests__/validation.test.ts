import { describe, it, expect } from 'vitest';
import { validateTaskInput } from '../validation';

const validBase = { title: 'My Task', quadrant: 'Q1' };

describe('validateTaskInput', () => {
  it('accepts a minimal valid input', () => {
    const result = validateTaskInput(validBase);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('accepts all optional fields when valid', () => {
    const result = validateTaskInput({
      title: 'Task',
      quadrant: 'Q2',
      description: 'Some description',
      deadline: '2025-12-31T00:00:00Z',
      urgency_threshold_days: 3,
    });
    expect(result.valid).toBe(true);
  });

  // Req 2.2, 2.8 — title validation
  it('rejects missing title', () => {
    const result = validateTaskInput({ quadrant: 'Q1' });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('rejects empty title', () => {
    const result = validateTaskInput({ title: '', quadrant: 'Q1' });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('rejects whitespace-only title', () => {
    const result = validateTaskInput({ title: '   ', quadrant: 'Q1' });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('rejects title exceeding 255 characters', () => {
    const result = validateTaskInput({ title: 'a'.repeat(256), quadrant: 'Q1' });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('accepts title of exactly 255 characters', () => {
    const result = validateTaskInput({ title: 'a'.repeat(255), quadrant: 'Q1' });
    expect(result.valid).toBe(true);
  });

  // Req 2.3 — description validation
  it('rejects description exceeding 2000 characters', () => {
    const result = validateTaskInput({ ...validBase, description: 'x'.repeat(2001) });
    expect(result.valid).toBe(false);
    expect(result.errors.description).toBeDefined();
  });

  it('accepts description of exactly 2000 characters', () => {
    const result = validateTaskInput({ ...validBase, description: 'x'.repeat(2000) });
    expect(result.valid).toBe(true);
  });

  it('accepts missing description', () => {
    const result = validateTaskInput(validBase);
    expect(result.valid).toBe(true);
  });

  // Req 2.5 — quadrant validation
  it('rejects missing quadrant', () => {
    const result = validateTaskInput({ title: 'Task' });
    expect(result.valid).toBe(false);
    expect(result.errors.quadrant).toBeDefined();
  });

  it('rejects invalid quadrant value', () => {
    const result = validateTaskInput({ title: 'Task', quadrant: 'Q5' });
    expect(result.valid).toBe(false);
    expect(result.errors.quadrant).toBeDefined();
  });

  it.each(['Q1', 'Q2', 'Q3', 'Q4'])('accepts quadrant %s', (q) => {
    const result = validateTaskInput({ title: 'Task', quadrant: q });
    expect(result.valid).toBe(true);
  });

  // Req 2.6, 4.3 — urgency_threshold_days requires deadline
  it('rejects urgency_threshold_days without deadline', () => {
    const result = validateTaskInput({ ...validBase, urgency_threshold_days: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors.urgency_threshold_days).toBeDefined();
  });

  it('accepts urgency_threshold_days with deadline', () => {
    const result = validateTaskInput({
      ...validBase,
      deadline: '2025-12-31T00:00:00Z',
      urgency_threshold_days: 3,
    });
    expect(result.valid).toBe(true);
  });

  // Req 2.7 — urgency_threshold_days ≥ 1
  it('rejects urgency_threshold_days of 0', () => {
    const result = validateTaskInput({
      ...validBase,
      deadline: '2025-12-31T00:00:00Z',
      urgency_threshold_days: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.urgency_threshold_days).toBeDefined();
  });

  it('rejects negative urgency_threshold_days', () => {
    const result = validateTaskInput({
      ...validBase,
      deadline: '2025-12-31T00:00:00Z',
      urgency_threshold_days: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.urgency_threshold_days).toBeDefined();
  });

  it('accepts urgency_threshold_days of exactly 1', () => {
    const result = validateTaskInput({
      ...validBase,
      deadline: '2025-12-31T00:00:00Z',
      urgency_threshold_days: 1,
    });
    expect(result.valid).toBe(true);
  });

  // Non-object input
  it('rejects null input', () => {
    const result = validateTaskInput(null);
    expect(result.valid).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateTaskInput('string');
    expect(result.valid).toBe(false);
  });
});
