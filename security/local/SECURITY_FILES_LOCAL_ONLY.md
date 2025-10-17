# Security Files - Local Development Only

## Purpose
This document lists all security-related files that should remain local and NOT be committed to the repository.

## Files Kept Local (via .gitignore):

### Security Test Scripts:
- `test_all_tables_security.ps1` - Comprehensive security test suite
- `security_audit_script.ps1` - Security audit automation
- `detailed_sql_security_audit.ps1` - Detailed SQL security checks
- `apply_secure_migration.ps1` - Secure migration application
- `restore_app_securely.ps1` - Secure restoration procedures
- `test_api_security.ps1` - API security testing

### Security Migration Files:
- `supabase/migrations/nuclear_policy_cleanup.sql` - Emergency cleanup procedures
- `supabase/migrations/secure_production_restore.sql` - Production restore procedures
- `supabase/migrations/temporary_development_restore.sql` - Development restore
- `supabase/migrations/20251017000002_fix_distributor_profiles_rls.sql` - RLS fixes

### Security Validation Scripts:
- `scripts/test-critical-vulnerabilities.ps1`
- `scripts/test-products-security.ps1`
- `scripts/test-profiles-vulnerability.ps1`
- `scripts/test-rls-security.ps1`
- `scripts/validate-distributor-profiles-rls.sql`
- `scripts/validate-products-rls.sql`

### Security Deployment Scripts:
- `scripts/deploy-products-rls-fix.ps1`
- `scripts/deploy-products-rls-fix.sh`
- `scripts/manual-deploy-rls-fix.*`

## Why These Files Stay Local:

1. **Security Sensitivity**: Contains internal security procedures and vulnerability assessments
2. **Emergency Procedures**: Includes emergency response and lockdown procedures
3. **Development Testing**: Security tests that reveal system internals
4. **Audit Information**: Contains detailed security audit results

## Production Deployment:

✅ **Safe to Commit:**
- `src/components/admin/DistributorApprovalManager.tsx` - Production admin component
- `src/hooks/use-distributor-approval.ts` - Production approval hooks  
- `supabase/migrations/distributor_approval_system.sql` - Production approval system
- Updated application files with approval workflow

❌ **Keep Local Only:**
- All security test and audit files listed above
- Emergency migration procedures
- Internal security documentation

## Usage:
Use these local files for:
- Security testing and validation
- Emergency response procedures  
- Development security audits
- Internal security assessments

Do NOT commit these files to maintain security and prevent exposure of internal procedures.