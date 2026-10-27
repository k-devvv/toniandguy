# Launch operations

## Current booking flow

A customer selects a preferred half-hour start time and service. A successful submission stores a pending request in Supabase. The receipt offers a WhatsApp message with its reference, salon, selected service, menu price, date/time and callback details. The customer must press Send in WhatsApp. The salon confirms availability and final price manually. Enquiries sent before a database save explicitly have no saved reference.

Staff accounts and Titan mailbox creation remain deferred at the client's request. Until staff accounts are enabled, the account owner reviews Supabase Table Editor → bookings. Do not expose Supabase dashboard access to customers.

## Backup setup — not enabled yet

Supabase Free projects need owner-managed off-site exports. This repository contains schema source, not a copy of customer records. No scheduled production backup or restore drill has been completed.

Use the official Supabase CLI backup/restore procedure:
https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
https://supabase.com/docs/guides/platform/backups

1. Choose a client-owned private backup destination outside this public repository. Enable encryption and restrict access to the owner. Keep the decryption secret separately.
2. Install the Supabase CLI and Docker using official vendor instructions. Obtain the database connection string from Supabase Connect; keep it in a local secret store and never paste it into chat or commit it.
3. Follow the official procedure to export roles, schema and data. Use a PostgreSQL client matching the project's major version. Protect temporary plaintext dump files and encrypt exports before uploading to the private backup destination.
4. Restore into a separate empty test project, never production. Verify bookings and audit event row counts, references, RLS, anonymous read restrictions, staff membership relationships and an actual booking save.
5. Only after a successful restore drill, enable a daily schedule on a client-controlled runner. The runner must alert on failure, cap retained encrypted backup files and retain the last successful snapshot. A local PC schedule does not run while the PC is off.
6. Set backup retention and customer-record retention with the account owner. No automatic customer deletion is enabled. Rate-limit hashes older than two days may be purged after the owner approves a scheduled cleanup.

## Domain/email activation

GoDaddy KYC/WHOIS verification remains required. GoDaddy currently disables DNS edits while the registrar hold remains. Do not change nameservers to the incomplete Cloudflare zone. After email setup resumes, copy the provider's actual MX, SPF, DKIM and DMARC values before any nameserver switch; verify both sending and receiving.

## Content approval

The supplied PDF contains conflicting haircut price tables. Both remain labelled separately. Only the client can choose the authoritative table. Service illustrations are labelled AI examples; they do not promise a particular result. Borrowed nearby-salon ratings have been removed from the website. The privacy page publishes the supplied contact number and describes actual manual retention behavior.
