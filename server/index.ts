import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env", ".env") });
config({ path: resolve(process.cwd(), ".env") });
import express, { type Request, Response, NextFunction } from "express";
import { getDbHostType } from "./config";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedData } from "./seed";
import { runMigrations } from "./migrate";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  // Log ALL incoming requests to debug routing issues
  if (req.path.startsWith('/api')) {
    console.log(`🌐 ${req.method} ${req.path} - Request received`);
  }
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Log storage/DB configuration on startup (Railway-only deployment)
const hasRailwayStorage = !!(
  process.env.RAILWAY_STORAGE_ACCESS_KEY_ID &&
  process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY &&
  process.env.RAILWAY_STORAGE_ENDPOINT
);
console.log("🔍 Storage/DB Check:");
console.log("  DB host type:", getDbHostType(), "(railway = preferred for Railway-only deployment)");
console.log("  Railway Storage:", hasRailwayStorage ? "✅ configured" : "❌ not configured");
console.log("  Supabase Storage:", (process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) && (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY) ? "configured (legacy - not used at runtime)" : "not configured");

(async () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:58',message:'Server startup begin',data:{hasPORT:!!process.env.PORT,nodeEnv:process.env.NODE_ENV||'development'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Run database migrations first (non-blocking - don't crash if it fails)
    try {
      await runMigrations();
      console.log('✅ Database migrations completed');
    } catch (error: any) {
      console.error('⚠️  Database migrations failed (non-critical):', error.message);
      console.error('   Server will continue, but some features may not work');
    }
    
    // Seed initial data (non-blocking - don't crash if it fails)
    // Run in background so it doesn't block server startup
    seedData().then(() => {
      console.log('✅ Initial data seeding completed');
    }).catch((error: any) => {
      console.error('⚠️  Data seeding failed (non-critical):', error.message);
      console.error('   Server will continue running');
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:65',message:'Before registerRoutes',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const server = await registerRoutes(app);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:66',message:'After registerRoutes',data:{hasServer:!!server},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:69',message:'Error middleware invoked',data:{status:err.status||err.statusCode||500,message:err.message,errorType:err?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const env = app.get("env");
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:78',message:'Before vite setup',data:{env,isDevelopment:env==='development'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (env === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:82',message:'After vite setup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:88',message:'Before server.listen',data:{port},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:94',message:'Server listening',data:{port},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      log(`serving on port ${port}`);
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.ts:96',message:'Server startup error',data:{errorType:error?.constructor?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
})();
