import { generateULID, isValidULID } from '../src/utils/ulid';

describe('ULID Utilities', () => {
  test('should generate valid ULID', () => {
    const id = generateULID();
    
    expect(typeof id).toBe('string');
    expect(id).toHaveLength(26);
    expect(isValidULID(id)).toBe(true);
  });

  test('should generate unique ULIDs', () => {
    const id1 = generateULID();
    const id2 = generateULID();
    
    expect(id1).not.toBe(id2);
  });

  test('should validate correct ULID format', () => {
    const validULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
    expect(isValidULID(validULID)).toBe(true);
  });

  test('should reject invalid ULID formats', () => {
    expect(isValidULID('')).toBe(false);
    expect(isValidULID('invalid')).toBe(false);
    expect(isValidULID('01ARZ3NDEKTSV4RRFFQ69G5FA')).toBe(false); // too short
    expect(isValidULID('01ARZ3NDEKTSV4RRFFQ69G5FAVV')).toBe(false); // too long
    expect(isValidULID('01ARZ3NDEKTSV4RRFFQ69G5FaV')).toBe(false); // lowercase
  });
});