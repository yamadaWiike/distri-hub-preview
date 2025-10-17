# Simple Project Reorganization Script
# Run this to organize your project files

Write-Host "Starting Project Reorganization..." -ForegroundColor Green

# Create directory structure
$directories = @(
    "config",
    "database\migrations", 
    "database\performance",
    "database\maintenance", 
    "database\setup",
    "security\scripts",
    "security\docs",
    "docs\deployment",
    "docs\features"
)

Write-Host "Creating directories..." -ForegroundColor Blue
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}

# Move configuration files
Write-Host "Moving configuration files..." -ForegroundColor Blue
$configFiles = @{
    "_build.config" = "config\build.config.js"
    "_headers.json" = "config\headers.json"
}

foreach ($source in $configFiles.Keys) {
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $configFiles[$source] -Force
        Write-Host "Moved: $source" -ForegroundColor Green
    }
}

# Move database files
Write-Host "Moving database files..." -ForegroundColor Blue
$dbFiles = @{
    "database_performance_optimization.sql" = "database\performance\database_performance_optimization.sql"
    "CRITICAL_TIMEZONE_FIX.sql" = "database\performance\CRITICAL_TIMEZONE_FIX.sql"
    "PERFORMANCE_OPTIMIZATION_REPORT.md" = "database\performance\PERFORMANCE_OPTIMIZATION_REPORT.md"
    "check_uom_products.sql" = "database\maintenance\check_uom_products.sql"
    "debug_regional_uom.sql" = "database\maintenance\debug_regional_uom.sql"
    "UPDATE_PRODUCTS_VIEW.sql" = "database\maintenance\UPDATE_PRODUCTS_VIEW.sql"
    "UPDATE_TEST_PRODUCT_UOM.sql" = "database\maintenance\UPDATE_TEST_PRODUCT_UOM.sql"
    "COMPLETE_UOM_SETUP.sql" = "database\setup\COMPLETE_UOM_SETUP.sql"
    "UOM_MIGRATION_STANDALONE.sql" = "database\setup\UOM_MIGRATION_STANDALONE.sql"
    "APPLY_UOM_MIGRATION.sh" = "database\setup\APPLY_UOM_MIGRATION.sh"
}

foreach ($source in $dbFiles.Keys) {
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dbFiles[$source] -Force
        Write-Host "Moved: $source" -ForegroundColor Green
    }
}

# Move security files
Write-Host "Moving security files..." -ForegroundColor Blue
$securityFiles = @{
    "detailed_sql_security_audit.ps1" = "security\scripts\detailed_sql_security_audit.ps1"
    "test_all_tables_security.ps1" = "security\scripts\test_all_tables_security.ps1"
    "test_api_security.ps1" = "security\scripts\test_api_security.ps1"
    "security_audit_script.ps1" = "security\scripts\security_audit_script.ps1"
    "apply_secure_migration.ps1" = "security\scripts\apply_secure_migration.ps1"
    "restore_app_securely.ps1" = "security\scripts\restore_app_securely.ps1"
    "SECURITY_AUDIT_REPORT.md" = "security\docs\SECURITY_AUDIT_REPORT.md"
    "SECURITY_IMPLEMENTATION_GUIDE.md" = "security\docs\SECURITY_IMPLEMENTATION_GUIDE.md"
    "USER_MANAGEMENT_FIX.md" = "security\docs\USER_MANAGEMENT_FIX.md"
}

foreach ($source in $securityFiles.Keys) {
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $securityFiles[$source] -Force
        Write-Host "Moved: $source" -ForegroundColor Green
    }
}

# Move documentation files
Write-Host "Moving documentation files..." -ForegroundColor Blue
$docFiles = @{
    "DEPLOYMENT.md" = "docs\deployment\DEPLOYMENT.md"
    "DISTRIBUTOR_APPROVAL_DEPLOYMENT_GUIDE.md" = "docs\deployment\DISTRIBUTOR_APPROVAL_DEPLOYMENT_GUIDE.md"
    "CLOUDFLARE_TROUBLESHOOTING.md" = "docs\deployment\CLOUDFLARE_TROUBLESHOOTING.md"
    "UOM_IMPLEMENTATION_STATUS.md" = "docs\features\UOM_IMPLEMENTATION_STATUS.md"
    "UOM_FIX_INSTRUCTIONS.md" = "docs\features\UOM_FIX_INSTRUCTIONS.md"
    "DAFTAR_PRODUK_UOM_INTEGRATION.md" = "docs\features\DAFTAR_PRODUK_UOM_INTEGRATION.md"
}

foreach ($source in $docFiles.Keys) {
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $docFiles[$source] -Force
        Write-Host "Moved: $source" -ForegroundColor Green
    }
}

# Move special folders
if (Test-Path "security-local") {
    if (-not (Test-Path "security\local")) {
        New-Item -ItemType Directory -Path "security\local" -Force | Out-Null
    }
    Move-Item -Path "security-local\*" -Destination "security\local" -Force
    Remove-Item -Path "security-local" -Force
    Write-Host "Moved: security-local folder" -ForegroundColor Green
}

if (Test-Path "supabase") {
    Move-Item -Path "supabase" -Destination "database\supabase" -Force
    Write-Host "Moved: supabase folder" -ForegroundColor Green
}

Write-Host "Project reorganization complete!" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Created organized folder structure" -ForegroundColor White
Write-Host "- Moved database files to database/" -ForegroundColor White  
Write-Host "- Moved security files to security/" -ForegroundColor White
Write-Host "- Moved documentation to docs/" -ForegroundColor White
Write-Host "- Moved configuration files to config/" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test that your project still builds: npm run dev" -ForegroundColor White
Write-Host "2. Update any import paths if needed" -ForegroundColor White
Write-Host "3. Check that all files moved correctly" -ForegroundColor White