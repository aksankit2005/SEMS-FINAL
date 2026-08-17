import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';
import { queryDb } from '../config/db.js';

// PR Coordinator / Staff Auth Middleware
export const verifyPRToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Staff or PR token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    if (['admin', 'super_coordinator', 'super_admin'].includes(decoded.role)) {
      req.user = decoded;
      return next();
    }

    if (decoded.username) {
      try {
        const dbRes = await queryDb('SELECT status FROM pr_users WHERE LOWER(username) = $1', [decoded.username.toLowerCase()]);
        if (dbRes && dbRes.rows.length > 0 && dbRes.rows[0].status && dbRes.rows[0].status.toLowerCase() === 'inactive') {
          return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
        }
      } catch (e) {}
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// College Head Auth Middleware
export const verifyCollegeHeadToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. College Head token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    if (decoded.role !== 'college_head') {
      return res.status(403).json({ message: 'Access denied. College Head role required.' });
    }
    if (decoded.username) {
      try {
        const userKey = decoded.username.toLowerCase();
        const dbRes = await queryDb('SELECT status FROM college_head_users WHERE LOWER(username) = $1', [userKey]);
        if (dbRes && dbRes.rows.length > 0 && dbRes.rows[0].status && dbRes.rows[0].status.toLowerCase() === 'inactive') {
          return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
        }
      } catch (e) {}
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired College Head token.' });
  }
};

// Sport Coordinator Auth Middleware
export const verifyCoordinatorToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Sport Coordinator token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    if (decoded.role !== 'sport_coordinator') {
      return res.status(403).json({ message: 'Access denied. Sport Coordinator role required.' });
    }
    if (decoded.username) {
      try {
        const userKey = decoded.username.toLowerCase().replace(/-/g, '_');
        const dbRes = await queryDb('SELECT status FROM sport_coordinators WHERE LOWER(username) = $1', [userKey]);
        if (dbRes && dbRes.rows.length > 0 && dbRes.rows[0].status && dbRes.rows[0].status.toLowerCase() === 'inactive') {
          return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
        }
      } catch (e) {}
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired Sport Coordinator token.' });
  }
};

// Super Coordinator Auth Middleware
export const verifySuperCoordinatorToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Super Coordinator or Admin token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    const role = (decoded.role || '').toLowerCase();
    if (!['super_coordinator', 'super coordinator', 'super_coord', 'admin', 'superadmin'].includes(role)) {
      return res.status(403).json({ message: 'Access denied. Super Coordinator or Admin role required.' });
    }
    if (decoded.username) {
      try {
        const userKey = decoded.username.toLowerCase();
        const dbRes = await queryDb('SELECT status FROM pr_users WHERE LOWER(username) = $1', [userKey]);
        if (dbRes && dbRes.rows.length > 0 && dbRes.rows[0].status && dbRes.rows[0].status.toLowerCase() === 'inactive') {
          return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
        }
      } catch (e) {}
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired Super Coordinator or Admin token.' });
  }
};

// Admin Auth Middleware
export const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Admin token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    const role = (decoded.role || '').toLowerCase();
    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired Admin token.' });
  }
};

// Admin or Super Coordinator Auth Middleware
export const verifyAdminOrSuperCoordinatorToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Admin or Super Coordinator token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    const role = (decoded.role || '').toLowerCase();
    if (!['admin', 'superadmin', 'super_coordinator'].includes(role)) {
      return res.status(403).json({ message: 'Access denied. Admin or Super Coordinator role required.' });
    }
    if (decoded.username && role === 'super_coordinator') {
      try {
        const userKey = decoded.username.toLowerCase();
        const dbRes = await queryDb('SELECT status FROM pr_users WHERE LOWER(username) = $1', [userKey]);
        if (dbRes && dbRes.rows.length > 0 && dbRes.rows[0].status && dbRes.rows[0].status.toLowerCase() === 'inactive') {
          return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
        }
      } catch (e) {}
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};


