import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string | null;
      phoneNumber?: string | null;
      voiceCommandsEnabled?: boolean | null;
      reminderSettings?: any;
      emailVerified?: boolean | null;
      createdAt?: Date | null;
      updatedAt?: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for parent authentication
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Check if user has a password set
          if (!(user as any).password) {
            return done(null, false, { message: "Account needs password setup. Please contact support." });
          }
          
          if (!(await comparePasswords(password, (user as any).password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false); // User not found, clear session
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialize user error:", error);
      done(null, false); // On error, clear session rather than failing
    }
  });

  // Parent registration endpoint
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phoneNumber, joinFamilyCode } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      let familyCode;

      // If joining existing family, validate the family code
      if (joinFamilyCode) {
        const existingFamily = await storage.getUserByFamilyCode(joinFamilyCode);
        if (!existingFamily) {
          return res.status(400).json({ message: "Invalid family code. Please check the code and try again." });
        }
        familyCode = joinFamilyCode;
      } else {
        // Generate unique family code for new family
        const generateFamilyCode = (): string => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
          let code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        };

        let attempts = 0;
        do {
          familyCode = generateFamilyCode();
          const existingCode = await storage.getUserByFamilyCode(familyCode);
          if (!existingCode) break;
          attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
          return res.status(500).json({ message: "Failed to generate unique family code" });
        }
      }

      // Create new user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        familyCode,
        phoneNumber: phoneNumber || null,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user as any;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Parent login endpoint
  app.post("/api/auth/login", passport.authenticate("local"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      
      // Clear child session data if exists
      req.session.childId = undefined;
      req.session.isChildUser = undefined;
      
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Child authentication middleware
export function isChildAuthenticated(req: any, res: any, next: any) {
  if (req.session.childId && req.session.isChildUser) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated as child" });
}

// Middleware that allows either parent or child authentication
export function isParentOrChildAuthenticated(req: any, res: any, next: any) {
  // Check if parent is authenticated
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check if child is authenticated
  if (req.session.childId && req.session.isChildUser) {
    return next();
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

export { hashPassword, comparePasswords };