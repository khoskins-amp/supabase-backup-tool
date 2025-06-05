# Managing Projects

Learn how to connect, configure, and manage your Supabase projects in the backup tool.

## Overview

Projects are the foundation of the Supabase Backup Tool. Each project represents a Supabase instance that you want to backup and manage. This guide covers everything you need to know about working with projects.

## Adding a New Project

### Prerequisites
Before adding a project, ensure you have:
- Access to your Supabase project dashboard
- Database connection string (required)
- API keys (optional but recommended for enhanced features)

### Step-by-Step Process

1. **Navigate to Projects**
   - Go to Dashboard → Projects
   - Click "Add Project" or "Add Your First Project"

2. **Enter Project Details**
   - **Project Name**: Choose a descriptive name for easy identification
   - **Environment**: Select Production, Staging, or Development
   - **Description**: Optional description for context

3. **Configure Database Connection**
   - **Database URL**: Enter your Supabase database connection string
   - Find this in: Supabase Project → Settings → Database → Connection string
   - The URL should follow this format:
     ```
     postgresql://postgres.xyz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
     ```

4. **Add API Keys (Optional but Recommended)**
   
   **Anonymous Key** (Public key):
   - Enables API connection testing
   - Used for client-side configuration validation
   - Find in: Project Settings → API → anon public key
   
   **Service Role Key** (Private key):
   - Enables Auth users and settings backup
   - Allows Storage buckets and files backup
   - Enables Edge functions backup
   - Find in: Project Settings → API → service_role key
   - ⚠️ **Important**: Keep this key secure and never expose it publicly

5. **Test Connection**
   - Click "Test Connection" to verify your setup
   - The system will validate your database connection and API keys
   - Review the capabilities detected by the test

6. **Save Project**
   - Click "Create Project" to save your configuration
   - The project will appear in your projects list

## Project Configuration

### Environment Types
- **Production**: Your live, customer-facing environment
- **Staging**: Pre-production testing environment
- **Development**: Local or development environment

### Capability Detection
When you test a connection, the system detects available features:
- ✅ **Database Backup/Restore**: Always available with database URL
- ✅ **Auth Backup/Restore**: Requires Service Role key
- ✅ **Storage Backup/Restore**: Requires Service Role key
- ✅ **Edge Functions Backup**: Requires Service Role key
- ✅ **API Connection Testing**: Requires Anonymous key

## Managing Existing Projects

### Viewing Project Details
- Click on any project card to view detailed information
- See backup history, statistics, and configuration
- Monitor connection status and last backup times

### Editing Projects
- Click the "Edit" button on a project card
- Modify any configuration except the project ID
- Update API keys, descriptions, or connection strings
- Changes take effect immediately

### Project Status Indicators
- 🟢 **Active**: Project is configured and ready for backups
- 🟡 **Warning**: Some features unavailable (missing API keys)
- 🔴 **Error**: Connection issues or misconfiguration
- ⏸️ **Paused**: Manually disabled for maintenance

### Disabling/Enabling Projects
- Use the toggle switch on project cards
- Disabled projects won't be included in automated backups
- Useful for maintenance periods or decommissioned environments

## Security Best Practices

### API Key Management
1. **Rotate Keys Regularly**: Update API keys periodically
2. **Principle of Least Privilege**: Only provide necessary keys
3. **Secure Storage**: Keys are encrypted in the database
4. **Environment Separation**: Use different keys for each environment

### Connection Security
- Always use SSL-enabled database connections
- Verify connection strings don't contain exposed credentials
- Use environment variables for sensitive configuration
- Monitor access logs and connection attempts

## Troubleshooting

### Common Issues

**Connection Test Fails**
- Verify database URL format and credentials
- Check network connectivity to Supabase
- Ensure database is accessible from your location
- Verify SSL requirements

**Invalid API Keys**
- Confirm keys are copied completely without extra spaces
- Ensure keys match the correct project
- Verify keys haven't been rotated in Supabase dashboard
- Check key permissions and expiration

**Missing Features**
- Service Role key required for Auth/Storage features
- Anonymous key required for API testing
- Some features require specific Supabase plan levels

### Error Messages
- **"Invalid database URL format"**: Check connection string syntax
- **"Connection refused"**: Network or firewall issues
- **"Invalid JWT"**: API key format or corruption issues
- **"Permission denied"**: Insufficient key permissions

## Best Practices

### Project Organization
- Use clear, descriptive project names
- Include environment indicators in names (e.g., "MyApp-Production")
- Group related projects using consistent naming
- Document project purposes in descriptions

### Configuration Management
- Keep API keys up to date
- Test connections regularly
- Monitor project health status
- Review and audit project access

### Backup Strategy
- Configure different retention policies per environment
- Schedule more frequent backups for production
- Test restore procedures regularly
- Document backup and restore processes

## Next Steps

After setting up your projects:
1. [Create your first backup](./creating-backups.md)
2. [Set up automated scheduling](./scheduling-backups.md)
3. [Configure backup retention policies](./backup-retention.md)
4. [Test restore procedures](./restoring-data.md)

## Related Topics
- [Creating Backups](./creating-backups.md)
- [Security & Encryption](../platform/security.md)
- [API Documentation](../platform/api.md)
- [Troubleshooting](../reference/troubleshooting.md) 