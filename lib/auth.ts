import { compare, hash } from 'bcryptjs'
import { prisma } from './prisma'

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}
