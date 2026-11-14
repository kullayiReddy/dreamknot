import { z } from 'zod';

export const payoutInputSchema = z.object({
  contributionId: z.string().uuid(),
  accountName: z.string().trim().min(2).max(100),
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Enter a valid bank account number'),
  confirmAccountNumber: z.string(),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code'),
  bankName: z.string().trim().min(2).max(100),
  acknowledged: z.literal(true, { errorMap: () => ({ message: 'Please acknowledge that this is a request, not a transfer' }) }),
}).refine((input) => input.accountNumber === input.confirmAccountNumber, { path: ['confirmAccountNumber'], message: 'Bank account numbers do not match' });

export function payoutNet(amount: number, refunds: Array<{ amount: number; status: string }>) {
  return Math.max(0, amount - refunds.filter((r) => ['initiating', 'pending', 'processed'].includes(r.status)).reduce((sum, r) => sum + r.amount, 0));
}

export function settlementDate(request?: { status: string; payment_mode: string; settled_at: string | null; transfer_reference: string | null }) {
  return request?.status === 'settled' && request.payment_mode === 'live' && request.transfer_reference && request.settled_at ? request.settled_at : null;
}