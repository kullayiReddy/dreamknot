import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { payoutInputSchema } from './payouts';

export const submitPayoutRequest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payoutInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: contribution, error } = await context.supabase.from('contributions').select('id,wedding_id,weddings(owner_id)').eq('id', data.contributionId).single();
    if (error || !contribution || contribution.weddings?.owner_id !== context.userId) throw new Error('Wedding not found or access denied');
    const secret = process.env['PAYOUT_BANK_ENCRYPTION_KEY'];
    const providerKey = process.env['RAZORPAY_KEY_ID'];
    if (!secret || !providerKey) throw new Error('Payout requests are not configured yet');
    const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(`${context.userId}:${data.contributionId}`) }, key, new TextEncoder().encode(JSON.stringify({ accountName: data.accountName, accountNumber: data.accountNumber, ifsc: data.ifsc, bankName: data.bankName })));
    const ciphertext = JSON.stringify({ version: 1, iv: btoa(String.fromCharCode(...iv)), data: btoa(String.fromCharCode(...new Uint8Array(encrypted))) });
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const result = await supabaseAdmin.rpc('submit_couple_payout', { _owner: context.userId, _contribution: data.contributionId, _ciphertext: ciphertext, _last4: data.accountNumber.slice(-4), _bank_name: data.bankName, _mode: providerKey.startsWith('rzp_live_') ? 'live' : 'test' });
    if (result.error) throw new Error(result.error.message);
    return { id: result.data };
  });