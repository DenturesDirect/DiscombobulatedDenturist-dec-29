import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { USE_MEM_STORAGE } from "./config";

const SALT_ROUNDS = 12;

const ALLOWED_STAFF = [
  { email: "damien@denturesdirect.ca", firstName: "Damien", lastName: "Hiorth", role: "admin" },
  { email: "michael@denturesdirect.ca", firstName: "Michael", lastName: "", role: "staff" },
  { email: "luisa@denturesdirect.ca", firstName: "Luisa", lastName: "", role: "staff" },
  { email: "info@denturesdirect.ca", firstName: "Caroline", lastName: "", role: "staff" },
];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAllowedEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  return ALLOWED_STAFF.some(staff => staff.email === normalizedEmail);
}

export function getStaffInfo(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  return ALLOWED_STAFF.find(staff => staff.email === normalizedEmail);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  
  let sessionStore;
  if (USE_MEM_STORAGE) {
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: sessionTtl,
    });
    console.log('🧠 Using in-memory session storage');
  } else {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        
        if (!isAllowedEmail(normalizedEmail)) {
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Access not authorized' });
        }

        const user = await storage.getUserByEmail(normalizedEmail);
        
        if (!user || !user.password) {
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isValid = await verifyPassword(password, user.password);
        
        if (!isValid) {
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Invalid credentials' });
        }

        await storage.logLoginAttempt(normalizedEmail, true);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error' });
        }
        return res.json({ 
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout error' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  });

  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      const dbUser = await storage.getUser(user.id);
      if (!dbUser || !dbUser.password) {
        return res.status(400).json({ message: 'User not found' });
      }

      const isValid = await verifyPassword(currentPassword, dbUser.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/login-attempts', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const attempts = await storage.getLoginAttempts();
      res.json(attempts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/reset-password', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password required' });
      }

      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    const sessionUser = req.user as any;
    if (!sessionUser?.id) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const dbUser = await storage.getUser(sessionUser.id);
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

export async function seedStaffAccounts() {
  console.log('👥 Checking staff accounts...');
  
  for (const staff of ALLOWED_STAFF) {
    const existingUser = await storage.getUserByEmail(staff.email);
    
    if (!existingUser) {
      const tempPassword = await hashPassword('TempPassword123!');
      
      await storage.upsertUser({
        id: randomUUID(),
        email: staff.email,
        password: tempPassword,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
      });
      
      console.log(`  ✓ Created account for ${staff.email} (temp password: TempPassword123!)`);
    } else if (!existingUser.password) {
      const tempPassword = await hashPassword('TempPassword123!');
      await storage.updateUserPassword(existingUser.id, tempPassword);
      console.log(`  ✓ Set temp password for ${staff.email}`);
    } else {
      console.log(`  ✓ Account exists for ${staff.email}`);
    }
  }
}
