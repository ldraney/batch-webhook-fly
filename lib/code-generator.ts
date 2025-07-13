import { customAlphabet } from 'nanoid'

// Create 5-digit alphanumeric generator (uppercase letters + numbers)
const generateCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5)

export function generateBatchCode(): string {
  return generateCode()
}
