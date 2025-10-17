# Project Reorganization Plan
## Current Issues Analysis & Solutions

### 🚨 Current Organization Problems

1. **Root Directory Clutter**: 40+ files in root directory
2. **Mixed Concerns**: SQL files, docs, scripts, configs all mixed together
3. **Unclear Naming**: Files like `_build.config`, random SQL files
4. **Scattered Documentation**: Multiple README files, guides in different locations
5. **Security Files Everywhere**: Security scripts and configs scattered
6. **Database Files Mixed**: SQL migrations, performance files, UOM files mixed
7. **Configuration Chaos**: Multiple config files with unclear purposes

### 🎯 Proposed New Structure

```
baskit-distributor-hub-25/
├── 📁 config/                           # All configuration files
│   ├── build.config.js                  # Renamed from _build.config
│   ├── headers.json                     # Renamed from _headers.json
│   ├── eslint.config.js                 # Keep here
│   ├── postcss.config.js               # Keep here
│   ├── tailwind.config.ts              # Keep here
│   ├── tsconfig.app.json               # Keep here
│   ├── tsconfig.json                   # Keep here
│   ├── tsconfig.node.json              # Keep here
│   ├── vite.config.ts                  # Keep here
│   ├── wrangler.toml                   # Keep here
│   ├── vercel.json                     # Keep here
│   └── components.json                 # Keep here
├── 📁 database/                         # All database-related files
│   ├── migrations/                     # Database migrations
│   │   ├── critical_security_fixes.sql
│   │   ├── function_search_path_fixes.sql
│   │   ├── final_function_search_path_fixes.sql
│   │   └── UOM_MIGRATION_STANDALONE.sql
│   ├── performance/                    # Performance optimizations
│   │   ├── database_performance_optimization.sql
│   │   ├── CRITICAL_TIMEZONE_FIX.sql
│   │   └── PERFORMANCE_OPTIMIZATION_REPORT.md
│   ├── maintenance/                    # Maintenance scripts
│   │   ├── check_uom_products.sql
│   │   ├── debug_regional_uom.sql
│   │   ├── UPDATE_PRODUCTS_VIEW.sql
│   │   └── UPDATE_TEST_PRODUCT_UOM.sql
│   ├── setup/                         # Database setup scripts
│   │   ├── COMPLETE_UOM_SETUP.sql
│   │   └── APPLY_UOM_MIGRATION.sh
│   └── supabase/                      # Supabase-specific files
│       ├── config.toml
│       └── migrations/
├── 📁 security/                        # All security-related files
│   ├── scripts/                       # Security scripts
│   │   ├── detailed_sql_security_audit.ps1
│   │   ├── test_all_tables_security.ps1
│   │   ├── test_api_security.ps1
│   │   ├── security_audit_script.ps1
│   │   └── apply_secure_migration.ps1
│   ├── local/                         # Local security files
│   │   └── [security-local contents]
│   ├── docs/                          # Security documentation
│   │   ├── SECURITY_AUDIT_REPORT.md
│   │   ├── SECURITY_IMPLEMENTATION_GUIDE.md
│   │   └── USER_MANAGEMENT_FIX.md
│   └── restore_app_securely.ps1
├── 📁 scripts/                         # Development and deployment scripts
│   ├── development/                   # Development scripts
│   ├── deployment/                    # Deployment scripts
│   └── maintenance/                   # Maintenance scripts
├── 📁 docs/                           # All documentation
│   ├── README.md                      # Main project README
│   ├── api/                          # API documentation
│   ├── deployment/                   # Deployment guides
│   │   ├── DEPLOYMENT.md
│   │   ├── DISTRIBUTOR_APPROVAL_DEPLOYMENT_GUIDE.md
│   │   └── CLOUDFLARE_TROUBLESHOOTING.md
│   ├── features/                     # Feature documentation
│   │   ├── UOM_IMPLEMENTATION_STATUS.md
│   │   ├── UOM_FIX_INSTRUCTIONS.md
│   │   └── DAFTAR_PRODUK_UOM_INTEGRATION.md
│   └── guides/                       # User and developer guides
├── 📁 src/                            # Source code (cleaned up)
│   ├── components/                    # React components (organized)
│   │   ├── ui/                       # Reusable UI components
│   │   ├── forms/                    # Form components
│   │   ├── layout/                   # Layout components
│   │   ├── admin/                    # Admin-specific components
│   │   ├── cart/                     # Cart-related components
│   │   └── shared/                   # Shared components
│   ├── pages/                        # Page components
│   ├── hooks/                        # Custom React hooks
│   ├── contexts/                     # React contexts
│   ├── services/                     # API services
│   ├── utils/                        # Utility functions
│   ├── types/                        # TypeScript type definitions
│   ├── constants/                    # Application constants
│   ├── lib/                         # Third-party library configurations
│   └── assets/                       # Static assets
├── 📁 public/                         # Public static files
├── 📁 data/                          # Data files
└── 📁 tools/                         # Development tools and utilities
    ├── build/                        # Build tools
    ├── testing/                      # Testing utilities
    └── generators/                   # Code generators
```

### 🔧 Implementation Benefits

1. **Clear Separation of Concerns**: Each folder has a single responsibility
2. **Easy Navigation**: Developers can find files quickly
3. **Better Maintainability**: Related files are grouped together
4. **Improved Onboarding**: New developers understand structure immediately
5. **Reduced Root Clutter**: Only essential files in root directory
6. **Better CI/CD**: Build processes can target specific folders
7. **Scalability**: Structure supports project growth

### 📋 Migration Strategy

1. **Phase 1**: Create new folder structure
2. **Phase 2**: Move files to appropriate locations
3. **Phase 3**: Update import paths and references
4. **Phase 4**: Update build and deployment configs
5. **Phase 5**: Update documentation and README

### 🎯 Priority Files to Reorganize

**High Priority** (Root clutter):
- All SQL files → `database/`
- Security scripts → `security/`
- Documentation → `docs/`
- Config files → `config/`

**Medium Priority** (Source organization):
- Better component organization
- Consolidated utilities
- Clearer type definitions

**Low Priority** (Nice to have):
- Development tools separation
- Enhanced build processes