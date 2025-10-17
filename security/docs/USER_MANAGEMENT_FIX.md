# User Management Fix Guide

## Problem
The user management system is getting 400 errors when trying to update user information due to:
1. Database permission issues (RLS policies)
2. Status constraint violations (`distributor_profiles_status_check`)

## Error Details
```
Supabase update error: {
  code: '23514',
  message: 'new row for relation "distributor_profiles" violates check constraint "distributor_profiles_status_check"'
}
```

## Solution

### Step 1: Apply Database Fix
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the **updated** contents of `/scripts/fix-user-management-permissions.sql`
4. Run the SQL script

### Step 2: Verify Fix
1. Go back to your admin panel
2. Try editing a user's information
3. The update should now work without errors

## What the Fix Does

### Permission Issues:
- Removes any recursive RLS policies that cause infinite loops
- Creates a simple admin policy based on email authentication
- Adds proper permissions for authenticated users
- Creates performance indexes

### Status Constraint Issues:
- Updates the status constraint to allow these values:
  - `active` - User is active and can use the system
  - `pending` - User registration is pending review
  - `approved` - User has been approved (similar to active)
  - `rejected` - User registration was rejected
  - `suspended` - User account is temporarily suspended
  - `inactive` - User account is inactive
  - `draft` - User profile is in draft state

### Enhanced Error Handling:
- Specific error messages for permission issues
- Specific error messages for constraint violations
- Helpful guidance for resolving each type of error

## Test the Feature
1. In the admin panel, go to the "Pengguna" tab
2. Click the Edit button (✏️) on any user
3. Try changing the status to different values
4. Make other changes to user information
5. Click Save
6. You should see a success message

## Available Actions
- **👁️ View**: See complete user profile details
- **✏️ Edit**: Update user information and business details  
- **🔄 Reset Password**: Send password reset email
- **🛡️ Toggle Role**: Change between admin/user permissions

## Status Options Available
- **Active**: User can fully use the system
- **Pending**: Awaiting approval or review
- **Approved**: Approved for system access
- **Rejected**: Registration denied
- **Suspended**: Temporarily blocked
- **Inactive**: Not currently active
- **Draft**: Profile being prepared

All features now include proper error handling and will show helpful messages if there are permission or constraint issues.