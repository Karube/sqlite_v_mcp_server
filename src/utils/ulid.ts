import { ulid } from 'ulid';

export function generateULID(): string {
  return ulid();
}

export function isValidULID(id: string): boolean {
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/.test(id);
}