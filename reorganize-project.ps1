# Project File Reorganization Script
# Run this script to reorganize the entire project structure

Write-Host "🚀 Starting Project Reorganization..." -ForegroundColor Green

# Create all necessary directories
$directories = @(
    "config",
    "database\migrations", 
    "database\performance",
    "database\maintenance", 
    "database\setup",
    "security\scripts",
    "security\docs", 
    "security\local",
    "docs\deployment",
    "docs\features",
    "docs\api",
    "docs\guides",
    "src\constants",
    "src\components\ui",
    "src\components\forms", 
    "src\components\layout",
    "src\components\shared",
    "tools\build",
    "tools\testing"
)

Write-Host "📁 Creating directory structure..." -ForegroundColor Blue
foreach ($dir in $directories) {
    $fullPath = Join-Path $PSScriptRoot $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Green
    }
}

# Define file movements
$fileMoves = @{
    # Configuration files
    "_build.config" = "config\build.config.js"
    "_headers.json" = "config\headers.json" 
    "eslint.config.js" = "config\eslint.config.js"
    "postcss.config.js" = "config\postcss.config.js"
    "tailwind.config.ts" = "config\tailwind.config.ts"
    "tsconfig.app.json" = "config\tsconfig.app.json"
    "tsconfig.json" = "config\tsconfig.json"
    "tsconfig.node.json" = "config\tsconfig.node.json"
    "vite.config.ts" = "config\vite.config.ts"
    "wrangler.toml" = "config\wrangler.toml"
    "vercel.json" = "config\vercel.json"
    "components.json" = "config\components.json"

    # Database files
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

    # Security files
    "detailed_sql_security_audit.ps1" = "security\scripts\detailed_sql_security_audit.ps1"
    "test_all_tables_security.ps1" = "security\scripts\test_all_tables_security.ps1"
    "test_api_security.ps1" = "security\scripts\test_api_security.ps1"
    "security_audit_script.ps1" = "security\scripts\security_audit_script.ps1"
    "apply_secure_migration.ps1" = "security\scripts\apply_secure_migration.ps1"
    "restore_app_securely.ps1" = "security\scripts\restore_app_securely.ps1"
    
    "SECURITY_AUDIT_REPORT.md" = "security\docs\SECURITY_AUDIT_REPORT.md"
    "SECURITY_IMPLEMENTATION_GUIDE.md" = "security\docs\SECURITY_IMPLEMENTATION_GUIDE.md"
    "USER_MANAGEMENT_FIX.md" = "security\docs\USER_MANAGEMENT_FIX.md"

    # Documentation files  
    "DEPLOYMENT.md" = "docs\deployment\DEPLOYMENT.md"
    "DISTRIBUTOR_APPROVAL_DEPLOYMENT_GUIDE.md" = "docs\deployment\DISTRIBUTOR_APPROVAL_DEPLOYMENT_GUIDE.md"
    "CLOUDFLARE_TROUBLESHOOTING.md" = "docs\deployment\CLOUDFLARE_TROUBLESHOOTING.md"
    
    "UOM_IMPLEMENTATION_STATUS.md" = "docs\features\UOM_IMPLEMENTATION_STATUS.md"
    "UOM_FIX_INSTRUCTIONS.md" = "docs\features\UOM_FIX_INSTRUCTIONS.md"
    "DAFTAR_PRODUK_UOM_INTEGRATION.md" = "docs\features\DAFTAR_PRODUK_UOM_INTEGRATION.md"
}

Write-Host "📦 Moving files to organized structure..." -ForegroundColor Blue
$moveCount = 0
foreach ($source in $fileMoves.Keys) {
    $sourcePath = Join-Path $PSScriptRoot $source
    $destPath = Join-Path $PSScriptRoot $fileMoves[$source]
    
    if (Test-Path $sourcePath) {
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Move-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  Moved: $source to $($fileMoves[$source])" -ForegroundColor Green
        $moveCount++
    } else {
        Write-Host "  Not found: $source" -ForegroundColor Yellow
    }
}

# Move security-local folder
if (Test-Path "security-local") {
    Move-Item -Path "security-local" -Destination "security\local" -Force
    Write-Host "  Moved: security-local to security\local" -ForegroundColor Green
    $moveCount++
}

# Move supabase folder to database
if (Test-Path "supabase") {
    Move-Item -Path "supabase" -Destination "database\supabase" -Force
    Write-Host "  Moved: supabase to database\supabase" -ForegroundColor Green
    $moveCount++
}

Write-Host "📝 Creating updated configuration files..." -ForegroundColor Blue

# Create updated package.json scripts
$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
    # Update scripts to reference new config locations
    if ($packageJson.scripts) {
        if ($packageJson.scripts.build) {
            $packageJson.scripts.build = $packageJson.scripts.build -replace "vite\.config\.ts", "config/vite.config.ts"
        }
        if ($packageJson.scripts.dev) {
            $packageJson.scripts.dev = $packageJson.scripts.dev -replace "vite\.config\.ts", "config/vite.config.ts"
        }
    }
    
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    Write-Host "  Updated package.json scripts" -ForegroundColor Green
}

# Create index.ts files for better imports
$indexFiles = @{
    "src\constants\index.ts" = "// Application constants`nexport * from './api';`nexport * from './routes';`nexport * from './ui';`nexport * from './business';"
    "src\components\index.ts" = "// Component exports for easier imports`nexport * from './ui';`nexport * from './forms';`nexport * from './layout';`nexport * from './shared';"
    "src\utils\index.ts" = "// Utility function exports`nexport * from './format';`nexport * from './validation';`nexport * from './api';`nexport * from './helpers';"
}

foreach ($file in $indexFiles.Keys) {
    $filePath = Join-Path $PSScriptRoot $file
    $content = $indexFiles[$file]
    
    $dir = Split-Path $filePath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    Write-Host "  Created: $file" -ForegroundColor Green
}

# Create main project README update
$readmePath = "README.md"
$readmeContent = @"
# Baskit Distributor Hub

A modern, secure distributor management platform built with React, TypeScript, and Supabase.

## 📁 Project Structure

\`\`\`
baskit-distributor-hub-25/
├── 📁 config/              # Configuration files
├── 📁 database/            # Database scripts and migrations
├── 📁 security/            # Security tools and documentation  
├── 📁 docs/                # Documentation
├── 📁 src/                 # Source code
├── 📁 public/              # Static files
└── 📁 tools/               # Development tools
\`\`\`

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Build for production
npm run build
\`\`\`

## 📖 Documentation

- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
- [Security Guide](security/docs/SECURITY_IMPLEMENTATION_GUIDE.md)
- [Database Setup](database/README.md)
- [API Documentation](docs/api/README.md)

## 🛠 Development

See [Development Guide](docs/guides/DEVELOPMENT.md) for detailed setup instructions.

## 🔒 Security

This project implements comprehensive security measures. See [Security Documentation](security/docs/) for details.
"@

Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
Write-Host "  Updated main README.md" -ForegroundColor Green

# Create database README
$dbReadmePath = "database\README.md"
$dbReadmeContent = "# Database Documentation`n`n## Structure`n`n- migrations/: Database migration scripts`n- performance/: Performance optimization queries`n- maintenance/: Maintenance and utility scripts`n- setup/: Initial database setup scripts`n- supabase/: Supabase-specific configurations`n`n## Quick Commands`n`nApply performance optimizations:`npsql -f database/performance/database_performance_optimization.sql`n`nRun critical timezone fix:`npsql -f database/performance/CRITICAL_TIMEZONE_FIX.sql`n`nSetup UOM system:`n./database/setup/APPLY_UOM_MIGRATION.sh`n`n## Performance`n`nSee performance/PERFORMANCE_OPTIMIZATION_REPORT.md for optimization details."

Set-Content -Path $dbReadmePath -Value $dbReadmeContent -Encoding UTF8
Write-Host "  Created database README.md" -ForegroundColor Green

Write-Host "Project reorganization complete!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Blue
Write-Host "  • Files moved: $moveCount" -ForegroundColor White
Write-Host "  • Directories created: $($directories.Count)" -ForegroundColor White  
Write-Host "  • Configuration updated: package.json, READMEs" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update import paths in source code" -ForegroundColor White
Write-Host "  2. Test build process with new structure" -ForegroundColor White
Write-Host "  3. Update CI/CD configurations if needed" -ForegroundColor White
Write-Host "  4. Commit changes to version control" -ForegroundColor White