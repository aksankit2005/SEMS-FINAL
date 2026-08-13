import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';

// PR Coordinator Auth Middleware
export const verifyPRToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. PR Coordinator token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// College Head Auth Middleware
export const verifyCollegeHeadToken = (req, res, next) => {
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
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired College Head token.' });
  }
};

// Sport Coordinator Auth Middleware
export const verifyCoordinatorToken = (req, res, next) => {
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
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired Sport Coordinator token.' });
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
    if (decoded.role !== 'ADMIN' && decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired Admin token.' });
  }
};
