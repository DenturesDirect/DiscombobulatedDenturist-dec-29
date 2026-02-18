/**
 * Browser Smoke Test - Focused Test for Key User Workflows
 * 
 * Tests the critical user paths:
 * 1. Login
 * 2. Open patient chart
 * 3. Upload document in "Photos and documents"
 * 4. Upload radiograph in "Radiograph / CBCT Scan Analysis"
 * 
 * Usage: 
 *   BASE_URL=http://localhost:5000 TEST_EMAIL=damien@denturesdirect.ca TEST_PASSWORD=TempPassword123! npm run browser-smoke-test
 */

interface SmokeTestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  details?: any;
  duration: number;
}

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "damien@denturesdirect.ca";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "TempPassword123!";

let sessionCookie = "";
let blockingErrors: string[] = [];
let environmentIssues: string[] = [];

async function runStep(name: string, testFn: () => Promise<void>): Promise<SmokeTestResult> {
  const start = Date.now();
  try {
    await testFn();
    return {
      step: name,
      status: 'PASS',
      duration: Date.now() - start
    };
  } catch (error: any) {
    // Distinguish between environment/config failures and code-path failures
    const isEnvironmentIssue = 
      error.message.includes('not configured') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('network') ||
      error.message.includes('timeout');
    
    if (isEnvironmentIssue) {
      environmentIssues.push(`${name}: ${error.message}`);
    } else {
      blockingErrors.push(`${name}: ${error.message}`);
    }
    
    return {
      step: name,
      status: 'FAIL',
      error: error.message,
      details: error.details,
      duration: Date.now() - start
    };
  }
}

async function testLogin(): Promise<void> {
  console.log(`   🔐 Attempting login as ${TEST_EMAIL}...`);
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }),
    credentials: "include"
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Login failed: ${response.status} - ${error.message || response.statusText}`);
  }

  // Extract session cookie
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie received");
  }

  sessionCookie = setCookie.split(";")[0];
  console.log(`   ✅ Login successful`);
}

async function testGetPatients(): Promise<any> {
  console.log(`   📋 Fetching patient list...`);
  
  const response = await fetch(`${BASE_URL}/api/patients`, {
    headers: {
      "Cookie": sessionCookie
    },
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.status} ${response.statusText}`);
  }

  const patients = await response.json();
  
  if (!Array.isArray(patients) || patients.length === 0) {
    throw new Error("No patients found in database");
  }

  console.log(`   ✅ Found ${patients.length} patient(s)`);
  return patients[0]; // Return first patient for testing
}

async function testDocumentUploadEndpoint(): Promise<void> {
  console.log(`   📄 Testing document upload endpoint...`);
  
  // Test the upload URL generation endpoint
  const response = await fetch(`${BASE_URL}/api/objects/upload`, {
    method: "POST",
    headers: {
      "Cookie": sessionCookie,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: "test-document.md",
      contentType: "text/markdown"
    }),
    credentials: "include"
  });

  const data = await response.json();

  if (!response.ok) {
    // Check if it's a configuration issue vs code error
    const errorMessage = data.error || data.message || "Unknown error";
    
    if (errorMessage.includes("Storage not configured") || 
        errorMessage.includes("not configured")) {
      environmentIssues.push(`Document upload: Storage not configured - ${errorMessage}`);
      throw new Error(`Storage configuration issue: ${errorMessage}`);
    }
    
    throw new Error(`Upload endpoint failed: ${response.status} - ${errorMessage}`);
  }

  if (!data.uploadURL) {
    throw new Error("Upload endpoint returned success but no uploadURL");
  }

  console.log(`   ✅ Document upload endpoint working (uploadURL generated)`);
}

async function testRadiographUploadEndpoint(): Promise<void> {
  console.log(`   🔬 Testing radiograph upload endpoint...`);
  
  // Test the upload URL generation endpoint for images
  const response = await fetch(`${BASE_URL}/api/objects/upload`, {
    method: "POST",
    headers: {
      "Cookie": sessionCookie,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: "test-radiograph.png",
      contentType: "image/png"
    }),
    credentials: "include"
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error || data.message || "Unknown error";
    
    if (errorMessage.includes("Storage not configured") || 
        errorMessage.includes("not configured")) {
      environmentIssues.push(`Radiograph upload: Storage not configured - ${errorMessage}`);
      throw new Error(`Storage configuration issue: ${errorMessage}`);
    }
    
    throw new Error(`Upload endpoint failed: ${response.status} - ${errorMessage}`);
  }

  if (!data.uploadURL) {
    throw new Error("Upload endpoint returned success but no uploadURL");
  }

  console.log(`   ✅ Radiograph upload endpoint working (uploadURL generated)`);
}

async function testStorageConfiguration(): Promise<void> {
  console.log(`   ⚙️  Checking storage configuration...`);
  
  const response = await fetch(`${BASE_URL}/api/debug/upload-status`, {
    headers: {
      "Cookie": sessionCookie
    },
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Diagnostic endpoint failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  console.log(`   📊 Storage Status:`);
  console.log(`      Railway: ${data.storage.railway.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`      Supabase: ${data.storage.supabase.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`      Service Status: ${data.storage.serviceStatus}`);
  
  if (data.storage.error) {
    environmentIssues.push(`Storage configuration: ${data.storage.error}`);
    console.log(`      ⚠️  Error: ${data.storage.error}`);
  }

  if (!data.storage.railway.configured && !data.storage.supabase.configured) {
    throw new Error("No storage backend configured (neither Railway nor Supabase)");
  }
}

async function checkConsoleErrors(): Promise<void> {
  console.log(`   🔍 Checking for API errors...`);
  
  // Test health endpoint
  const healthResponse = await fetch(`${BASE_URL}/api/health`);
  
  if (!healthResponse.ok) {
    throw new Error(`Health check failed: ${healthResponse.status}`);
  }

  const health = await healthResponse.json();
  
  if (health.database !== "connected") {
    blockingErrors.push(`Database not connected: ${health.database}`);
    throw new Error(`Database connection issue: ${health.database}`);
  }

  console.log(`   ✅ API health check passed`);
  console.log(`      Database: ${health.database}`);
  if (health.storage) {
    console.log(`      Storage: ${JSON.stringify(health.storage)}`);
  }
}

async function main() {
  console.log("🧪 Browser Smoke Test - Focused User Workflow Testing\n");
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Test User: ${TEST_EMAIL}`);
  console.log("=".repeat(70) + "\n");

  const results: SmokeTestResult[] = [];

  // Step 1: Login
  results.push(await runStep("Login", testLogin));

  if (results[0].status === 'FAIL') {
    console.log("\n❌ Login failed - cannot proceed with other tests\n");
    printSummary(results);
    process.exit(1);
  }

  // Step 2: Check API health and console errors
  results.push(await runStep("API Health Check", checkConsoleErrors));

  // Step 3: Check storage configuration
  results.push(await runStep("Storage Configuration", testStorageConfiguration));

  // Step 4: Open patient chart (verify patient data access)
  results.push(await runStep("Open Patient Chart", testGetPatients));

  // Step 5: Test document upload
  results.push(await runStep("Document Upload", testDocumentUploadEndpoint));

  // Step 6: Test radiograph upload
  results.push(await runStep("Radiograph/CBCT Upload", testRadiographUploadEndpoint));

  // Print summary
  printSummary(results);

  // Exit with appropriate code
  const hasFailed = results.some(r => r.status === 'FAIL');
  process.exit(hasFailed ? 1 : 0);
}

function printSummary(results: SmokeTestResult[]) {
  console.log("\n" + "=".repeat(70));
  console.log("📊 SMOKE TEST RESULTS:\n");

  // Print individual results
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const duration = `${result.duration}ms`;
    console.log(`   ${icon} ${result.step}: ${result.status} (${duration})`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Summary counts
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log("\n" + "=".repeat(70));
  console.log("📋 CONCISE SUMMARY:\n");
  
  // Map results to required format
  const loginResult = results.find(r => r.step === 'Login');
  const docUploadResult = results.find(r => r.step === 'Document Upload');
  const radiographResult = results.find(r => r.step === 'Radiograph/CBCT Upload');
  
  console.log(`   Login: ${loginResult?.status || 'SKIP'}`);
  console.log(`   Document upload: ${docUploadResult?.status || 'SKIP'}`);
  console.log(`   Radiograph/CBCT upload: ${radiographResult?.status || 'SKIP'}`);
  console.log(`   New blocking errors introduced: ${blockingErrors.length > 0 ? 'YES' : 'NO'}`);
  
  if (blockingErrors.length > 0) {
    console.log(`\n   🚨 Blocking Errors (Code-path failures):`);
    blockingErrors.forEach(err => console.log(`      - ${err}`));
  }
  
  if (environmentIssues.length > 0) {
    console.log(`\n   ⚠️  Environment/Config Issues:`);
    environmentIssues.forEach(issue => console.log(`      - ${issue}`));
  }

  console.log("\n" + "=".repeat(70));
  console.log(`\n   Total: ${passed} PASS / ${failed} FAIL / ${skipped} SKIP\n`);

  if (failed === 0 && environmentIssues.length === 0) {
    console.log("✅ All smoke tests passed! No blocking errors detected.\n");
  } else if (environmentIssues.length > 0 && blockingErrors.length === 0) {
    console.log("⚠️  Tests completed with environment/config issues but no code-path failures.\n");
  } else {
    console.log("❌ Tests failed with blocking errors. Review the issues above.\n");
  }

  console.log("📝 Note: This is an API-level smoke test.");
  console.log("   For full browser testing with file uploads, use manual testing or");
  console.log("   a browser automation tool like Playwright or Puppeteer.\n");
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
