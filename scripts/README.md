# Scripts Directory

This directory contains various utility scripts for development and debugging.

## Security Notice

⚠️ **WARNING**: Some scripts in this directory perform sensitive operations including:
- Direct database modifications
- Data cleanup operations  
- User data transfers
- Test data seeding

### Security Guidelines

1. **Production Access**: These scripts should NEVER be run against production databases
2. **Environment Variables**: Scripts requiring `SUPABASE_SERVICE_ROLE_KEY` contain privileged operations
3. **Audit Trail**: Always document when and why admin scripts are run
4. **Access Control**: Limit access to these scripts to authorized developers only

### Script Categories

#### Safe Scripts (Read-only operations)
- `test-*.ts` - Testing and debugging scripts
- `analyze-*.ts` - Analysis scripts
- `check-*.ts` - Read-only verification scripts
- `debug-*.ts` - Debugging helpers

#### Sensitive Scripts (Write operations) 
- `cleanup-*.ts` - Database cleanup operations
- `fix-*.ts` - Data correction scripts
- `seed-*.ts` - Test data population
- `transfer-*.ts` - Data migration scripts

### Best Practices

1. Always use read-only operations when possible
2. Test scripts in development environment first
3. Use database transactions for data modifications
4. Add confirmation prompts for destructive operations
5. Log all operations for audit purposes

### Moving to Production

For production environments:
1. Remove all admin scripts from the deployment
2. Use proper database migration tools instead
3. Implement admin operations through secure, authenticated API endpoints
4. Use role-based access control for administrative functions