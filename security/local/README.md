# Security Files - Local Only

This directory contains security-related files that should NOT be committed to the repository.

## Files kept local:
- Security test scripts
- Security audit reports  
- Emergency migration files
- Security assessment documents
- Database restoration scripts

## Why local only?
- Contains sensitive security analysis
- Includes internal security procedures
- May reveal system vulnerabilities
- Contains emergency response procedures

## Usage:
These files are for local development and security testing only. 
Use them for security audits, testing, and emergency procedures, but do not commit to version control.

## Git Configuration:
These files are excluded via .gitignore patterns:
- `test_all_tables_security.ps1`
- `scripts/security-test-instructions.ps1`
- `SECURITY_*.md`
- `supabase/migrations/*security*`
- `supabase/migrations/*emergency*`
- `supabase/migrations/*lockdown*`
- `supabase/migrations/*restoration*`