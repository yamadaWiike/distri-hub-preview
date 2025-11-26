#!/bin/bash

# Script to apply banking and operational fields migration to Supabase
# This adds the missing fields for the "Perbankan & Operasional" section

set -e

echo "🚀 Applying Banking & Operational Fields Migration"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with:"
    echo "  VITE_SUPABASE_URL=your_supabase_url"
    echo "  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

# Load environment variables
source .env

# Check if required variables exist
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: VITE_SUPABASE_URL not found in .env"
    exit 1
fi

# Extract project reference from Supabase URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

echo "📋 Project Reference: $PROJECT_REF"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found"
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Link to project (if not already linked)
echo "🔗 Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF || true

echo ""
echo "📤 Applying migration..."
echo ""

# Apply the migration
supabase db push

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "📊 Fields added to distributor_profiles table:"
echo "   Banking:"
echo "   - nama_bank (Bank name)"
echo "   - nama_pemilik_akun (Account owner name)"
echo "   - nomor_rekening (Account number)"
echo "   - jumlah_armada_pengiriman (Fleet size)"
echo ""
echo "   PIC (Person In Charge):"
echo "   - nama_pic (PIC name)"
echo "   - posisi_pic (PIC position)"
echo "   - nomor_kontak_pic (PIC phone)"
echo "   - email_pic (PIC email)"
echo ""
echo "   Warehouse & Company:"
echo "   - alamat_gudang (Warehouse address)"
echo "   - koordinat (GPS coordinates)"
echo "   - foto_gudang (Warehouse photo)"
echo "   - omzet (Revenue)"
echo "   - bentuk_usaha (Business entity)"
echo "   - nib (Business ID)"
echo ""
echo "   Documents:"
echo "   - npwp_file_url (NPWP document URL)"
echo "   - nib_file_url (NIB document URL)"
echo "   - ktp_file_url (KTP document URL)"
echo ""
echo "✨ You can now use the 'Perbankan & Operasional' section in the profile!"
