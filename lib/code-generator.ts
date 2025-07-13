import { customAlphabet } from 'nanoid'

// Create 6-digit alphanumeric generator (uppercase letters + numbers)
const generateCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6)

export function generateBatchCode(): string {
  return generateCode()
}
