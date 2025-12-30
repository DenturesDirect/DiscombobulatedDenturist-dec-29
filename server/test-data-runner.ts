// Standalone script to run test data seeding
import { seedTestData } from "./test-data";
import { ensureDb } from "./db";

(async () => {
  try {
    // Ensure database is connected
    ensureDb();
    
    console.log("🚀 Starting test data seeding...\n");
    await seedTestData();
    console.log("\n✅ Done! Test data has been added to your database.");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding test data:", error);
    process.exit(1);
  }
})();




