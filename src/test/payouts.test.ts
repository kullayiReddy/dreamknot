import { describe, it, expect } from 'vitest';
import { payoutInputSchema, payoutNet, settlementDate } from '@/lib/payouts';

describe('couple payouts', () => {
  it('paid gift amount is reduced by all reserved and completed refunds', () => {
    expect(payoutNet(1000, [{ amount: 100, status: 'initiating' }, { amount: 200, status: 'pending' }, { amount: 300, status: 'processed' }, { amount: 50, status: 'failed' }])).toBe(400);
  });
  it('a requested payout never supplies a settlement date', () => {
    expect(settlementDate({ status: 'requested', payment_mode: 'live', settled_at: '2026-11-14T13:22:00Z', transfer_reference: 'bank-ref' })).toBeNull();
  });
  it('test payments cannot imply a bank settlement', () => {
    expect(settlementDate({ status: 'settled', payment_mode: 'test', settled_at: '2026-11-14T13:22:00Z', transfer_reference: 'bank-ref' })).toBeNull();
  });
  it('verified live settlement displays its recorded date', () => {
    expect(settlementDate({ status: 'settled', payment_mode: 'live', settled_at: '2026-11-14T13:22:00Z', transfer_reference: 'bank-ref' })).toBe('2026-11-14T13:22:00Z');
  });
  it('account numbers must match and the request-only acknowledgement is required', () => {
    const input = { contributionId: 'c90e5364-cf20-4218-93ab-eb9ec665a581', accountName: 'Test Couple', bankName: 'Test Bank', accountNumber: '1234567890', confirmAccountNumber: '1234567890', ifsc: 'ABCD0123456', acknowledged: true };
    expect(payoutInputSchema.safeParse(input).success).toBe(true);
    expect(payoutInputSchema.safeParse({ ...input, confirmAccountNumber: '1234567891' }).success).toBe(false);
    expect(payoutInputSchema.safeParse({ ...input, acknowledged: false }).success).toBe(false);
  });
});