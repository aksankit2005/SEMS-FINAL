import { queryDb } from '../config/db.js';

/**
 * Persists an administrative/lifecycle audit log event to PostgreSQL without blocking.
 *
 * @param {Object} params
 * @param {string} [params.userId] - User or Actor ID
 * @param {string} [params.actorName] - Username or display name
 * @param {string} [params.role] - ADMIN | SUPER_COORDINATOR | COLLEGE_HEAD | SPORTS_COORDINATOR
 * @param {string} params.action - Action description
 * @param {string} [params.entity] - Target entity name / ID / summary
 * @param {string} [params.entityId] - Optional entity ID
 * @param {Object} [params.details] - JSON metadata
 * @param {string} [params.ipAddress] - Client IP address
 */
export const logAuditEvent = async ({
  userId = null,
  actorName = 'System',
  role = 'ADMIN',
  action,
  entity = null,
  entityId = null,
  details = null,
  ipAddress = '127.0.0.1'
}) => {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    await queryDb(
      `INSERT INTO audit_logs (id, actor_name, role, action, entity, entity_id, details, ip_address, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [
        actorName || 'System',
        role || 'ADMIN',
        action || 'Action',
        entity || '',
        entityId ? String(entityId) : null,
        detailsJson,
        ipAddress || '127.0.0.1'
      ]
    );
  } catch (err) {
    // Non-blocking: audit log errors must never disrupt core business operations
    console.warn('[AuditLogger] Non-fatal log write error:', err.message);
  }
};
