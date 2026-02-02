/**
 * Upload Fix Verification - Static Code Analysis
 * 
 * Verifies that all the error handling fixes are properly implemented
 * by checking the code structure without requiring a running server.
 * 
 * Usage: npm run verify-upload-fix
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface VerificationResult {
  file: string;
  checks: {
    name: string;
    passed: boolean;
    error?: string;
  }[];
}

const checks: VerificationResult[] = [];

function checkFile(filePath: string, checks: Array<{ name: string; pattern: RegExp; required: boolean; description?: string }>) {
  const fullPath = resolve(process.cwd(), filePath);
  
  if (!existsSync(fullPath)) {
    return {
      file: filePath,
      checks: [{
        name: "File exists",
        passed: false,
        error: `File not found: ${filePath}`
      }]
    };
  }

  const content = readFileSync(fullPath, "utf-8");
  const fileChecks = checks.map(check => {
    const matches = content.match(check.pattern);
    const passed = check.required ? !!matches : true;
    
    return {
      name: check.name,
      passed,
      error: check.required && !matches ? check.description || `Pattern not found: ${check.pattern}` : undefined
    };
  });

  return {
    file: filePath,
    checks: fileChecks
  };
}

function main() {
  console.log("🔍 Verifying Upload Error Handling Fix Implementation\n");
  console.log("=".repeat(60) + "\n");

  // Check ObjectUploader.tsx
  checks.push(checkFile("client/src/components/ObjectUploader.tsx", [
    {
      name: "onError prop defined",
      pattern: /onError\?:\s*\(error:\s*Error\)\s*=>\s*void/,
      required: true,
      description: "onError prop should be defined in ObjectUploaderProps"
    },
    {
      name: "Error event listener for upload-error",
      pattern: /\.on\(["']upload-error["']/,
      required: true,
      description: "Should listen for 'upload-error' events"
    },
    {
      name: "Error event listener for error",
      pattern: /\.on\(["']error["']/,
      required: true,
      description: "Should listen for 'error' events"
    },
    {
      name: "Try-catch in getUploadParameters",
      pattern: /try\s*\{[\s\S]*?onGetUploadParameters[\s\S]*?\}\s*catch/,
      required: true,
      description: "getUploadParameters callback should have try-catch"
    },
    {
      name: "Error callback invocation",
      pattern: /onErrorRef\.current\(/,
      required: true,
      description: "Should call onError callback when errors occur"
    }
  ]));

  // Check DocumentUploadZone.tsx
  checks.push(checkFile("client/src/components/DocumentUploadZone.tsx", [
    {
      name: "Try-catch in onGetUploadParameters",
      pattern: /onGetUploadParameters.*?async.*?\{[\s\S]*?try\s*\{[\s\S]*?apiRequest.*?\/api\/objects\/upload[\s\S]*?\}\s*catch/,
      required: true,
      description: "onGetUploadParameters should have try-catch around apiRequest"
    },
    {
      name: "User-friendly error messages",
      pattern: /Storage not configured|File storage is not configured|Please contact your administrator/,
      required: true,
      description: "Should have user-friendly error messages"
    },
    {
      name: "Toast notifications for errors",
      pattern: /toast\(\s*\{[\s\S]*?title:.*?Upload Error/i,
      required: true,
      description: "Should show toast notifications for upload errors"
    },
    {
      name: "onError callback passed to ObjectUploader",
      pattern: /onError=\{[^}]*error[^}]*\}/,
      required: true,
      description: "Should pass onError callback to ObjectUploader"
    }
  ]));

  // Check NewPatientDialog.tsx
  checks.push(checkFile("client/src/components/NewPatientDialog.tsx", [
    {
      name: "Try-catch in onGetUploadParameters",
      pattern: /onGetUploadParameters.*?async.*?\{[\s\S]*?try\s*\{[\s\S]*?apiRequest.*?\/api\/objects\/upload[\s\S]*?\}\s*catch/,
      required: true,
      description: "onGetUploadParameters should have try-catch around apiRequest"
    },
    {
      name: "User-friendly error messages",
      pattern: /Storage not configured|File storage is not configured|Please contact your administrator/,
      required: true,
      description: "Should have user-friendly error messages"
    },
    {
      name: "onError callback passed to ObjectUploader",
      pattern: /onError=\{[^}]*error[^}]*\}/,
      required: true,
      description: "Should pass onError callback to ObjectUploader"
    }
  ]));

  // Check RadiographAnalysis.tsx
  checks.push(checkFile("client/src/components/RadiographAnalysis.tsx", [
    {
      name: "Try-catch in onGetUploadParameters",
      pattern: /onGetUploadParameters.*?async.*?\{[\s\S]*?try\s*\{[\s\S]*?apiRequest.*?\/api\/objects\/upload[\s\S]*?\}\s*catch/,
      required: true,
      description: "onGetUploadParameters should have try-catch around apiRequest"
    },
    {
      name: "onError callback passed to ObjectUploader",
      pattern: /onError=\{[^}]*error[^}]*\}/,
      required: true,
      description: "Should pass onError callback to ObjectUploader"
    },
    {
      name: "useToast imported",
      pattern: /import.*?useToast.*?from/,
      required: true,
      description: "Should import useToast hook"
    }
  ]));

  // Check Dashboard.tsx photo upload error handling
  checks.push(checkFile("client/src/pages/Dashboard.tsx", [
    {
      name: "Error handling in photo upload",
      pattern: /catch\s*\(error.*?\)\s*\{[\s\S]*?Storage not configured|File storage is not configured/,
      required: true,
      description: "Photo upload should have error handling with user-friendly messages"
    },
    {
      name: "Toast notifications for photo errors",
      pattern: /toast\(\s*\{[\s\S]*?title:.*?(Upload.*?(Failed|Error)|Error)/i,
      required: true,
      description: "Should show toast notifications for photo upload errors"
    }
  ]));

  // Check server/routes.ts
  checks.push(checkFile("server/routes.ts", [
    {
      name: "Diagnostic logging in upload endpoint",
      pattern: /console\.log.*?Upload request from user/,
      required: true,
      description: "Should log upload requests with user info"
    },
    {
      name: "User-friendly error messages in upload endpoint",
      pattern: /File storage is not configured|Please contact your administrator/,
      required: true,
      description: "Should return user-friendly error messages"
    },
    {
      name: "Try-catch in upload endpoint",
      pattern: /app\.post\(["']\/api\/objects\/upload["'][\s\S]*?try\s*\{[\s\S]*?catch/,
      required: true,
      description: "Upload endpoint should have try-catch"
    },
    {
      name: "Diagnostic endpoint exists",
      pattern: /app\.get\(["']\/api\/debug\/upload-status["']/,
      required: true,
      description: "Should have diagnostic endpoint /api/debug/upload-status"
    },
    {
      name: "Diagnostic endpoint returns user info",
      pattern: /user:\s*\{[\s\S]*?email[\s\S]*?role/,
      required: true,
      description: "Diagnostic endpoint should return user information"
    },
    {
      name: "Diagnostic endpoint returns storage status",
      pattern: /storage:\s*\{[\s\S]*?railway[\s\S]*?supabase/,
      required: true,
      description: "Diagnostic endpoint should return storage configuration status"
    }
  ]));

  // Print results
  let totalChecks = 0;
  let passedChecks = 0;

  checks.forEach(result => {
    console.log(`📄 ${result.file}`);
    result.checks.forEach(check => {
      totalChecks++;
      const icon = check.passed ? "✅" : "❌";
      console.log(`   ${icon} ${check.name}`);
      if (!check.passed && check.error) {
        console.log(`      ⚠️  ${check.error}`);
      }
      if (check.passed) {
        passedChecks++;
      }
    });
    console.log("");
  });

  // Summary
  console.log("=".repeat(60));
  console.log(`📊 Verification Summary: ${passedChecks}/${totalChecks} checks passed\n`);

  if (passedChecks === totalChecks) {
    console.log("✅ All code checks passed! The upload error handling fix is properly implemented.");
    console.log("\n📝 Next Steps:");
    console.log("   1. Start the server: npm run dev");
    console.log("   2. Run integration tests: npm run test-upload-fix");
    console.log("   3. Test in browser: Upload a file and verify error messages appear as toast notifications");
    process.exit(0);
  } else {
    console.log(`❌ ${totalChecks - passedChecks} check(s) failed. Please review the implementation.`);
    process.exit(1);
  }
}

main();
