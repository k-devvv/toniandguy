# Database setup

Apply `migrations/001_booking_crm.sql` using the Supabase SQL editor as the project administrator. Use a fresh project or review existing objects first; migration intentionally fails on duplicate objects.

Create staff users through Supabase Authentication dashboard (invite or create confirmed account). Disable public signups in Auth settings and configure allowed redirect URLs. Use strong passwords and enable MFA under your organization policy. Browser login uses Supabase Auth with the anonymous key; staff access requires membership below.

Run as administrator, substituting a real Auth user UUID:

```sql
insert into public.staff_memberships(user_id,branch_id,role)
values ('00000000-0000-0000-0000-000000000000','s','staff');
-- Add a second row for access to p. An owner membership grants all branches:
-- insert into public.staff_memberships values ('USER_UUID','s','owner');
```

Never allow browser membership writes. Remove rows to revoke access immediately. Booking RPC uses only the Worker service role credential. Staff queries use their JWT with the anonymous API key and database RLS; updates are transactional RPCs that independently check membership and version. Anonymous table access is denied.

Allowed status transitions: pending -> contacted/confirmed/declined/cancelled; contacted -> confirmed/declined/cancelled; confirmed -> completed/no_show/cancelled. Same status updates and append-only notes increment version and audit changes. Confirmation requires an exact appointment timestamp. This system does not enforce chair or stylist capacity; staff must check availability manually.

Rate buckets are durable and atomic, expire logically after an hour, and allow 30 new requests per hashed IP and five per separately hashed mobile number. Replays of a committed idempotency key do not consume quota. Periodically delete rate rows older than two days using an administrator scheduled SQL job. Configure Supabase backups and retention before handling real contacts; restrict dashboard access. Set API maximum rows to at least 1000; exports page through records and are bounded to 10000 rows. Never publish database dumps or customer records.

Integration verification requires an actual configured Supabase project: apply migration, provision separate branch staff, check branch restrictions and guessed record IDs, concurrent updates, repeat idempotency keys, and transaction rollback. Local API tests use fetch mocks and do not establish live database correctness.
