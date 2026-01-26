import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { randomUUID, randomBytes } from "crypto";
import { storage } from "./storage";
import { USE_MEM_STORAGE } from "./config";

const SALT_ROUNDS = 12;

const ALLOWED_STAFF = [
  // Dentures Direct users
  { email: "damien@denturesdirect.ca", firstName: "Damien", lastName: "Hiorth", role: "admin", officeName: "Dentures Direct", canViewAllOffices: true },
  { email: "michael@denturesdirect.ca", firstName: "Michael", lastName: "", role: "staff", officeName: "Dentures Direct", canViewAllOffices: true },
  { email: "luisa@denturesdirect.ca", firstName: "Luisa", lastName: "", role: "staff", officeName: "Dentures Direct", canViewAllOffices: true },
  { email: "info@denturesdirect.ca", firstName: "Caroline", lastName: "", role: "staff", officeName: "Dentures Direct", canViewAllOffices: true },
  // Toronto Smile Centre users
  { email: "info@torontosmilecenter.ca", firstName: "Admin", lastName: "", role: "admin", officeName: "Toronto Smile Centre", canViewAllOffices: false },
  { email: "dentist@torontosmilecentre.ca", firstName: "Priyanka", lastName: "Choudhary", role: "staff", officeName: "Toronto Smile Centre", canViewAllOffices: false },
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
  if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production. Add it to Railway Variables.');
    }
    // Generate a random session secret for development only
    const devSecret = randomBytes(32).toString('base64');
    process.env.SESSION_SECRET = devSecret;
    console.warn('⚠️  WARNING: SESSION_SECRET not set. Using auto-generated secret for development only.');
    console.warn('   Set SESSION_SECRET in your .env file for production use.');
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  
  let sessionStore;
  if (USE_MEM_STORAGE) {
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: sessionTtl,
    });
    console.log('🧠 Using in-memory session storage');
  } else {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required when not using in-memory storage. Add it to Railway Variables.');
    }
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // Changed to true to auto-create sessions table
      ttl: sessionTtl,
      tableName: "sessions",
    });
    console.log('💾 Using PostgreSQL session storage');
  }
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax', // Added for better compatibility
    },
  });
}

export async function setupLocalAuth(app: Express) {
  console.log('🔧 Setting up local authentication...');
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log('✅ Local authentication setup complete');

  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`🔐 Login attempt for: ${normalizedEmail}`);
        
        if (!isAllowedEmail(normalizedEmail)) {
          console.log(`❌ Login rejected: Email ${normalizedEmail} not in allowed list`);
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Access not authorized' });
        }

        const user = await storage.getUserByEmail(normalizedEmail);
        
        if (!user) {
          console.log(`⚠️  Login attempt failed: User not found for ${normalizedEmail}`);
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        if (!user.password || (typeof user.password === 'string' && user.password.trim() === '')) {
          console.log(`⚠️  Login attempt failed: User ${normalizedEmail} has no password set`);
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isValid = await verifyPassword(password, user.password);
        
        if (!isValid) {
          console.log(`❌ Login attempt failed: Invalid password for ${normalizedEmail}`);
          await storage.logLoginAttempt(normalizedEmail, false);
          return done(null, false, { message: 'Invalid credentials' });
        }

        console.log(`✅ Login successful for ${normalizedEmail}`);
        await storage.logLoginAttempt(normalizedEmail, true);
        return done(null, user);
      } catch (error: any) {
        console.error(`❌ Authentication error for ${email}:`, error.message);
        console.error('   Stack:', error.stack);
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

  console.log('📝 Registering /api/auth/login route...');
  app.post('/api/auth/login', (req, res, next) => {
    console.log('📥 POST /api/auth/login - Request received');
    console.log('   Headers:', JSON.stringify(req.headers, null, 2).substring(0, 200));
    console.log('   Body:', { email: req.body?.email ? req.body.email.substring(0, 20) + '...' : 'missing', hasPassword: !!req.body?.password });
    console.log('   Raw body:', typeof req.body, Object.keys(req.body || {}));
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        console.error('❌ Passport authentication error:', err.message);
        console.error('   Stack:', err.stack);
        return res.status(500).json({ message: 'Authentication error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
      }
      if (!user) {
        console.log(`❌ Login failed: ${info?.message || 'Invalid credentials'}`);
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, async (err) => {
        if (err) {
          console.error('❌ Session login error:', err.message);
          return res.status(500).json({ message: 'Login error' });
        }
        try {
          // Get full user with office info
          const dbUser = await storage.getUser(user.id);
          console.log(`✅ Session created for ${user.email}`);
          return res.json({ 
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            officeId: dbUser?.officeId ?? null,
            canViewAllOffices: dbUser?.canViewAllOffices ?? false
          });
        } catch (error: any) {
          console.error('❌ Error fetching user after login:', error.message);
          return res.status(500).json({ message: 'Error completing login' });
        }
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

  // Emergency password reset for allowed staff emails (no auth required)
  app.post('/api/auth/emergency-reset', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Only allow reset for emails in the ALLOWED_STAFF list
      if (!isAllowedEmail(normalizedEmail)) {
        return res.status(403).json({ message: 'Email not authorized for emergency reset' });
      }

      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ message: 'Account not found. The account may need to be created.' });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      console.log(`⚠️  Emergency password reset for ${normalizedEmail}`);
      
      res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/auth/user', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = req.user as any;
    // Get full user with office info
    const dbUser = await storage.getUser(user.id);
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      officeId: dbUser?.officeId ?? null,
      canViewAllOffices: dbUser?.canViewAllOffices ?? false
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

async function seedOffices(): Promise<Record<string, string>> {
  console.log('📍 Seeding offices...');
  const officeMap: Record<string, string> = {};
  
  if (USE_MEM_STORAGE) {
    // For in-memory storage, offices aren't persisted, so return empty map
    console.log('  ⚠️  Using in-memory storage - offices not persisted');
    return officeMap;
  }
  
  try {
    const { offices } = await import("@shared/schema");
    const { ensureDb } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const db = ensureDb();
    
    // Define the offices we need
    const requiredOffices = [
      { name: "Dentures Direct" },
      { name: "Toronto Smile Centre" }
    ];
    
    // Check existing offices
    const existingOffices = await db.select().from(offices);
    const existingNames = new Set(existingOffices.map(o => o.name));
    
    // Create missing offices
    for (const office of requiredOffices) {
      if (!existingNames.has(office.name)) {
        try {
          const result = await db.insert(offices)
            .values({ name: office.name })
            .returning();
          
          if (result && result.length > 0) {
            officeMap[office.name] = result[0].id;
            console.log(`  ✅ Created office '${office.name}' (${result[0].id})`);
          }
        } catch (error: any) {
          // If office already exists (race condition), fetch it
          const fetched = await db.select().from(offices)
            .where(eq(offices.name, office.name))
            .limit(1);
          if (fetched.length > 0) {
            officeMap[office.name] = fetched[0].id;
            console.log(`  ✅ Office '${office.name}' already exists (${fetched[0].id})`);
          } else {
            console.error(`  ❌ Failed to create office '${office.name}':`, error.message);
          }
        }
      } else {
        // Office already exists, add to map
        const existingOffice = existingOffices.find(o => o.name === office.name);
        if (existingOffice) {
          officeMap[existingOffice.name] = existingOffice.id;
          console.log(`  ✅ Office '${existingOffice.name}' already exists (${existingOffice.id})`);
        }
      }
    }
    
    // Ensure we have all offices in the map (in case we missed any)
    for (const existingOffice of existingOffices) {
      if (requiredOffices.some(ro => ro.name === existingOffice.name)) {
        officeMap[existingOffice.name] = existingOffice.id;
      }
    }
    
    return officeMap;
  } catch (error: any) {
    console.error('  ❌ Error seeding offices:', error.message);
    console.error('   This might indicate a database connection issue.');
    return officeMap;
  }
}

export async function seedStaffAccounts() {
  console.log('👥 Checking staff accounts...');
  
  // Check SESSION_SECRET first
  if (!process.env.SESSION_SECRET) {
    console.error('❌ SESSION_SECRET is not set! Login will not work.');
    console.error('   Add SESSION_SECRET to Railway Variables');
    return;
  }
  
  try {
    // Seed offices first to ensure they exist
    const officeMap = await seedOffices();
    
    // If no offices were found/created, log a warning
    if (Object.keys(officeMap).length === 0 && !USE_MEM_STORAGE) {
      console.warn('  ⚠️  No offices found in database. Users will be created without office assignments.');
    }
    
    for (const staff of ALLOWED_STAFF) {
      try {
        const existingUser = await storage.getUserByEmail(staff.email);
        const officeId = officeMap[staff.officeName] || null;
        
        if (!existingUser) {
          // Create new user with temp password and office assignment
          const tempPassword = await hashPassword('TempPassword123!');
          
          await storage.upsertUser({
            id: randomUUID(),
            email: staff.email,
            password: tempPassword,
            firstName: staff.firstName,
            lastName: staff.lastName,
            role: staff.role,
            officeId: officeId,
            canViewAllOffices: staff.canViewAllOffices || false,
          });
          
          const officeInfo = officeId ? ` (${staff.officeName})` : ' (no office assigned)';
          const permissionInfo = staff.canViewAllOffices ? ', can view all offices' : '';
          console.log(`  ✅ Created account for ${staff.email}${officeInfo}${permissionInfo}`);
        } else {
          // User exists - check what needs updating
          let updated = false;
          const updates: any = {
            id: existingUser.id,
            email: existingUser.email,
            password: existingUser.password, // Preserve existing password
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
            officeId: existingUser.officeId,
            canViewAllOffices: existingUser.canViewAllOffices,
          };
          
          // Update officeId if missing or incorrect
          if (officeId && existingUser.officeId !== officeId) {
            updates.officeId = officeId;
            updated = true;
          }
          
          // Update canViewAllOffices if incorrect
          if (updates.canViewAllOffices !== (staff.canViewAllOffices || false)) {
            updates.canViewAllOffices = staff.canViewAllOffices || false;
            updated = true;
          }
          
          // Set temp password if user has no password (null, undefined, or empty string)
          if (!existingUser.password || (typeof existingUser.password === 'string' && existingUser.password.trim() === '')) {
            const tempPassword = await hashPassword('TempPassword123!');
            updates.password = tempPassword;
            updated = true;
            console.log(`  ✅ Set temp password for ${staff.email}`);
          }
          
          // Apply updates if needed
          if (updated) {
            await storage.upsertUser(updates);
            const changes = [];
            if (updates.officeId !== existingUser.officeId) {
              changes.push(`office: ${staff.officeName}`);
            }
            if (updates.canViewAllOffices !== existingUser.canViewAllOffices) {
              changes.push(`permissions: ${updates.canViewAllOffices ? 'can view all' : 'single office'}`);
            }
            if (!existingUser.password) {
              changes.push('password: set');
            }
            console.log(`  ✅ Updated account for ${staff.email} (${changes.join(', ')})`);
          } else {
            console.log(`  ✓ Account exists for ${staff.email} (${staff.officeName || 'no office'})`);
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Error seeding account for ${staff.email}:`, error.message);
      }
    }
    
    // Summary
    console.log(`\n✅ Staff account seeding complete. Processed ${ALLOWED_STAFF.length} staff accounts.`);
    console.log(`   Offices available: ${Object.keys(officeMap).length}`);
    if (Object.keys(officeMap).length === 0 && !USE_MEM_STORAGE) {
      console.warn('   ⚠️  WARNING: No offices found. Users may not have office assignments.');
    }
  } catch (error: any) {
    console.error('❌ Error during staff account seeding:', error.message);
    console.error('   This might indicate a database connection issue.');
    throw error; // Re-throw to surface the error
  }
}
