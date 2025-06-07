import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../init';
import { db } from '../../db/client';
import { projects } from '../../db/projects.schema';
import { eq } from 'drizzle-orm';
import { encryptForDatabase, decryptFromDatabase } from '../../crypto';
import { parseSupabaseDatabaseUrl } from '../../utils';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const createProjectInput = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development']).default('production'),
  databaseUrl: z.string().url('Invalid database URL'),
  supabaseServiceKey: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  organizationId: z.string().optional(),
});

const updateProjectInput = createProjectInput.partial().extend({
  id: z.string().uuid(),
});

export const projectsRouter = createTRPCRouter({
  // List all projects (with decrypted sensitive fields)
  list: publicProcedure.query(async () => {
    try {
      console.log('🔍 Projects.list called - fetching from database...');
      const results = await db.select().from(projects);
      console.log(`📊 Found ${results.length} projects in database:`, results.map(p => ({ id: p.id, name: p.name })));
      
      // Decrypt sensitive fields for each project
      const decryptedProjects = await Promise.all(
        results.map(async (project) => ({
          ...project,
          databaseUrl: await decryptFromDatabase(project.databaseUrl) || '',
          supabaseServiceKey: await decryptFromDatabase(project.supabaseServiceKey),
          supabaseAnonKey: await decryptFromDatabase(project.supabaseAnonKey),
          // Add computed supabaseUrl for convenience
          supabaseUrl: `https://${project.projectRef}.supabase.co`,
        }))
      );

      console.log('✅ Projects.list returning:', { success: true, count: decryptedProjects.length });
      return {
        success: true,
        data: decryptedProjects,
      };
    } catch (error) {
      console.error('❌ Failed to list projects:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list projects',
      });
    }
  }),

  // Get project by ID (with decrypted sensitive fields)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const result = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.id))
          .limit(1);

        if (result.length === 0) {
          return {
            success: false,
            error: 'Project not found',
          };
        }

        const project = result[0];
        const decryptedProject = {
          ...project,
          databaseUrl: await decryptFromDatabase(project.databaseUrl) || '',
          supabaseServiceKey: await decryptFromDatabase(project.supabaseServiceKey),
          supabaseAnonKey: await decryptFromDatabase(project.supabaseAnonKey),
          // Add computed supabaseUrl for convenience
          supabaseUrl: `https://${project.projectRef}.supabase.co`,
        };

        return {
          success: true,
          data: decryptedProject,
        };
      } catch (error) {
        console.error('Failed to get project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get project',
        });
      }
    }),

  // Create new project (encrypts sensitive fields)
  create: publicProcedure
    .input(createProjectInput)
    .mutation(async ({ input }) => {
      try {
        // Validate required fields before encryption
        if (!input.databaseUrl) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Database URL is required',
          });
        }

        // Parse the database URL to extract essential components
        const urlParseResult = parseSupabaseDatabaseUrl(input.databaseUrl);
        if (!urlParseResult.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: urlParseResult.error || 'Invalid Supabase database URL format',
          });
        }

        // Ensure we have required extracted values
        if (!urlParseResult.projectRef || !urlParseResult.region) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Could not extract project reference or region from database URL',
          });
        }

        // Encrypt sensitive fields before storing
        const encryptedDatabaseUrl = await encryptForDatabase(input.databaseUrl);
        if (!encryptedDatabaseUrl) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to encrypt database URL',
          });
        }

        const encryptedData = {
          name: input.name,
          description: input.description || null,
          environment: input.environment || "production",
          databaseUrl: encryptedDatabaseUrl,
          supabaseServiceKey: await encryptForDatabase(input.supabaseServiceKey || null),
          supabaseAnonKey: await encryptForDatabase(input.supabaseAnonKey || null),
          
          // Auto-extracted from database URL (not encrypted) - now required
          projectRef: urlParseResult.projectRef,
          region: urlParseResult.region,
          
          // Organization support
          organizationId: input.organizationId || null,
          
          isActive: true,
          backupRetentionDays: 30,
          totalBackups: 0,
          totalSize: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db
          .insert(projects)
          .values(encryptedData)
          .returning();

        const createdProject = result[0];

        // Return with decrypted fields for immediate use
        const decryptedProject = {
          ...createdProject,
          databaseUrl: input.databaseUrl,
          supabaseServiceKey: input.supabaseServiceKey || null,
          supabaseAnonKey: input.supabaseAnonKey || null,
          // Add computed supabaseUrl for convenience
          supabaseUrl: `https://${urlParseResult.projectRef}.supabase.co`,
        };

        return {
          success: true,
          data: decryptedProject,
          message: `Project created successfully. Project: ${urlParseResult.projectRef} in ${urlParseResult.region}`,
        };
      } catch (error) {
        console.error('Failed to create project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project',
        });
      }
    }),

  // Update project (encrypts sensitive fields)
  update: publicProcedure
    .input(updateProjectInput)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        // Encrypt sensitive fields if they're being updated
        const encryptedUpdateData: any = {};
        
        if (updateData.name !== undefined) encryptedUpdateData.name = updateData.name;
        if (updateData.description !== undefined) encryptedUpdateData.description = updateData.description;
        if (updateData.environment !== undefined) encryptedUpdateData.environment = updateData.environment;
        if (updateData.organizationId !== undefined) encryptedUpdateData.organizationId = updateData.organizationId;
        
        if (updateData.databaseUrl !== undefined) {
          // Parse the new database URL to extract components
          const urlParseResult = parseSupabaseDatabaseUrl(updateData.databaseUrl);
          if (!urlParseResult.isValid) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: urlParseResult.error || 'Invalid Supabase database URL format',
            });
          }
          
          // Ensure we have required extracted values
          if (!urlParseResult.projectRef || !urlParseResult.region) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Could not extract project reference or region from database URL',
            });
          }
          
          encryptedUpdateData.databaseUrl = await encryptForDatabase(updateData.databaseUrl);
          
          // Update auto-extracted fields
          encryptedUpdateData.projectRef = urlParseResult.projectRef;
          encryptedUpdateData.region = urlParseResult.region;
        }
        if (updateData.supabaseServiceKey !== undefined) {
          encryptedUpdateData.supabaseServiceKey = await encryptForDatabase(updateData.supabaseServiceKey || null);
        }
        if (updateData.supabaseAnonKey !== undefined) {
          encryptedUpdateData.supabaseAnonKey = await encryptForDatabase(updateData.supabaseAnonKey || null);
        }

        encryptedUpdateData.updatedAt = new Date();

        const result = await db
          .update(projects)
          .set(encryptedUpdateData)
          .where(eq(projects.id, id))
          .returning();

        if (result.length === 0) {
          return {
            success: false,
            error: 'Project not found',
          };
        }

        const updatedProject = result[0];

        // Return with decrypted fields
        const decryptedProject = {
          ...updatedProject,
          databaseUrl: await decryptFromDatabase(updatedProject.databaseUrl) || '',
          supabaseServiceKey: await decryptFromDatabase(updatedProject.supabaseServiceKey),
          supabaseAnonKey: await decryptFromDatabase(updatedProject.supabaseAnonKey),
          // Add computed supabaseUrl for convenience
          supabaseUrl: `https://${updatedProject.projectRef}.supabase.co`,
        };

        return {
          success: true,
          data: decryptedProject,
          message: 'Project updated successfully',
        };
      } catch (error) {
        console.error('Failed to update project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project',
        });
      }
    }),

  // Delete project
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const result = await db
          .delete(projects)
          .where(eq(projects.id, input.id));

        return {
          success: true,
          message: 'Project deleted successfully',
        };
      } catch (error) {
        console.error('Failed to delete project:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete project',
        });
      }
    }),

  // Test connection (temporarily decrypts URL for testing)
  testConnection: publicProcedure
    .input(z.object({
      databaseUrl: z.string().url(),
      supabaseServiceKey: z.string().optional(),
      supabaseAnonKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement actual connection testing
        // For now, return mock data based on provided keys
        const features = {
          database: true, // Always true if we have a database URL
          auth: !!input.supabaseServiceKey,
          storage: !!input.supabaseServiceKey,
          functions: !!input.supabaseServiceKey,
          api: !!input.supabaseAnonKey,
        };

        return {
          success: true,
          data: {
            connected: true,
            features,
            message: 'Connection test successful',
          },
        };
      } catch (error) {
        console.error('Connection test failed:', error);
        return {
          success: false,
          error: 'Connection test failed',
        };
      }
    }),
}); 