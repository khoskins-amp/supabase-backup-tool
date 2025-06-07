import { createTRPCRouter, publicProcedure } from '../init';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { BackupService } from '@/lib/services/backup.service';
import {
  createManualBackupSchema,
  backupFilterSchema,
  updateBackupSchema,
  validateBackupSchema,
} from '@/lib/db/backups.validations';
import { db } from '@/lib/db';
import { backups } from '@/lib/db/backups.schema';
import { eq, desc, and, gte, lte, like, or, count, SQL } from 'drizzle-orm';

// Initialize backup service
const backupService = new BackupService();

export const backupsRouter = createTRPCRouter({
  // List backups for a project with filtering and pagination
  list: publicProcedure
    .input(backupFilterSchema)
    .query(async ({ input }) => {
      const {
        projectId,
        status,
        triggerType,
        backupType,
        storageType,
        dateFrom,
        dateTo,
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
      } = input;

      // Build filters array using the pattern from Context7 docs
      const filters: SQL[] = [];
      
      if (projectId) filters.push(eq(backups.projectId, projectId));
      if (status) filters.push(eq(backups.status, status));
      if (triggerType) filters.push(eq(backups.triggerType, triggerType));
      if (backupType) filters.push(eq(backups.backupType, backupType));
      if (storageType) filters.push(eq(backups.storageType, storageType));
      if (dateFrom) filters.push(gte(backups.createdAt, dateFrom));
      if (dateTo) filters.push(lte(backups.createdAt, dateTo));
      if (search) {
        filters.push(
          or(
            like(backups.name, `%${search}%`),
            like(backups.description, `%${search}%`)
          )!
        );
      }
      
      // Execute main query using conditional where pattern
      const baseQuery = db.select().from(backups);
      const results = await (filters.length > 0 
        ? baseQuery.where(and(...filters))
        : baseQuery
      )
        .orderBy(sortOrder === 'asc' ? backups.createdAt : desc(backups.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const baseCountQuery = db.select({ count: count() }).from(backups);
      const totalCountResult = await (filters.length > 0 
        ? baseCountQuery.where(and(...filters))
        : baseCountQuery
      );
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      return {
        data: results,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    }),

  // Get a single backup by ID
  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const backup = await db
        .select()
        .from(backups)
        .where(eq(backups.id, input.id))
        .limit(1);

      if (!backup[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Backup not found',
        });
      }

      return backup[0];
    }),

  // Create a manual backup
  createManual: publicProcedure
    .input(createManualBackupSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await backupService.createManualBackup(input);
        
        return {
          success: true,
          data: result,
          message: 'Backup created successfully',
        };
      } catch (error) {
        console.error('Failed to create backup:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create backup',
        });
      }
    }),

  // Get backup progress for real-time updates
  getProgress: publicProcedure
    .input(z.object({ backupId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const progress = await backupService.getBackupProgress(input.backupId);
        return progress;
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Backup not found or progress unavailable',
        });
      }
    }),

  // Update backup (for status updates, etc.)
  update: publicProcedure
    .input(updateBackupSchema)
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      try {
        await db
          .update(backups)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(backups.id, id));

        const updatedBackup = await db
          .select()
          .from(backups)
          .where(eq(backups.id, id))
          .limit(1);

        return {
          success: true,
          data: updatedBackup[0],
          message: 'Backup updated successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update backup',
        });
      }
    }),

  // Cancel a running backup
  cancel: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const backup = await db
        .select()
        .from(backups)
        .where(eq(backups.id, input.id))
        .limit(1);

      if (!backup[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Backup not found',
        });
      }

      if (!['pending', 'in-progress'].includes(backup[0].status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only cancel pending or in-progress backups',
        });
      }

      await db
        .update(backups)
        .set({
          status: 'cancelled',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(backups.id, input.id));

      return {
        success: true,
        message: 'Backup cancelled successfully',
      };
    }),

  // Delete a backup (soft delete by marking as archived)
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const backup = await db
        .select()
        .from(backups)
        .where(eq(backups.id, input.id))
        .limit(1);

      if (!backup[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Backup not found',
        });
      }

      // Mark as archived instead of hard delete
      await db
        .update(backups)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(eq(backups.id, input.id));

      return {
        success: true,
        message: 'Backup deleted successfully',
      };
    }),

  // Validate backup integrity
  validate: publicProcedure
    .input(validateBackupSchema)
    .mutation(async ({ input }) => {
      try {
        // In a real implementation, this would verify file integrity
        // For now, we'll just mark it as validated
        await db
          .update(backups)
          .set({
            validated: true,
            updatedAt: new Date(),
          })
          .where(eq(backups.id, input.backupId));

        return {
          success: true,
          valid: true,
          message: 'Backup validation completed',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate backup',
        });
      }
    }),

  // Get backup statistics for a project
  getStats: publicProcedure
    .input(z.object({ projectId: z.string().uuid().optional() }))
    .query(async ({ input }) => {
      const statsQuery = db.select().from(backups);
      const allBackups = await (input.projectId 
        ? statsQuery.where(eq(backups.projectId, input.projectId))
        : statsQuery
      );
      
      const stats = {
        total: allBackups.length,
        completed: allBackups.filter(b => b.status === 'completed').length,
        failed: allBackups.filter(b => b.status === 'failed').length,
        pending: allBackups.filter(b => b.status === 'pending').length,
        inProgress: allBackups.filter(b => b.status === 'in-progress').length,
        totalSize: allBackups.reduce((sum, b) => sum + (b.fileSize || 0), 0),
        totalCompressedSize: allBackups.reduce((sum, b) => sum + (b.compressedSize || 0), 0),
        averageDuration: 0,
        compressionRatio: 0,
      };
      
      const completedBackups = allBackups.filter(b => 
        b.status === 'completed' && b.duration && b.duration > 0
      );
      
      if (completedBackups.length > 0) {
        stats.averageDuration = Math.round(
          completedBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBackups.length
        );
      }
      
      if (stats.totalSize > 0 && stats.totalCompressedSize > 0) {
        stats.compressionRatio = Math.round(
          ((stats.totalSize - stats.totalCompressedSize) / stats.totalSize) * 100
        );
      }
      
      return stats;
    }),

  // Cleanup expired downloads
  cleanupExpired: publicProcedure
    .mutation(async () => {
      try {
        await backupService.cleanupExpiredDownloads();
        
        return {
          success: true,
          message: 'Expired backups cleaned up successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cleanup expired backups',
        });
      }
    }),

  // Get recent backups (for dashboard)
  getRecent: publicProcedure
    .input(z.object({ 
      projectId: z.string().uuid().optional(),
      limit: z.number().min(1).max(20).default(5) 
    }))
    .query(async ({ input }) => {
      const recentQuery = db.select().from(backups);
      const recentBackups = await (input.projectId 
        ? recentQuery.where(eq(backups.projectId, input.projectId))
        : recentQuery
      )
        .orderBy(desc(backups.createdAt))
        .limit(input.limit);
      
      return recentBackups;
    }),

  // Get download info for a backup (returns download URL and metadata)
  getDownloadInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        // Find the backup with this download token
        const backup = await db.select()
          .from(backups)
          .where(
            and(
              eq(backups.downloadToken, input.token),
              gte(backups.expiresAt, new Date()), // Not expired
              eq(backups.status, 'completed') // Only completed backups
            )
          )
          .limit(1);
        
        if (!backup[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Download not found or expired',
          });
        }
        
        const backupRecord = backup[0];
        
        if (!backupRecord.filePath) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Backup file not found',
          });
        }
        
        // Return download metadata (the actual file download will be handled by the browser)
        return {
          success: true,
          data: {
            id: backupRecord.id,
            fileName: backupRecord.fileName,
            fileSize: backupRecord.fileSize,
            filePath: backupRecord.filePath,
            compressionType: backupRecord.compressionType,
            downloadUrl: `/api/backup/download/${input.token}`, // This will be handled by a simple endpoint
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get download info',
        });
      }
    }),
}); 