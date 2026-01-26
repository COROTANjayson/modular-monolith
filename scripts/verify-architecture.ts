/**
 * Architecture Compliance Verification Script
 * Run this to verify the codebase follows ARCHITECTURE.md
 */

import * as fs from "fs";
import * as path from "path";

interface ComplianceIssue {
  file: string;
  line: number;
  rule: string;
  message: string;
  severity: "error" | "warning";
}

const issues: ComplianceIssue[] = [];

// Helper to check if file imports forbidden modules
function checkImports(filePath: string, layer: string, content: string) {
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    if (line.includes("import ") && !line.trim().startsWith("//")) {
      // Domain layer checks
      if (layer === "domain") {
        if (
          line.includes("express") ||
          line.includes("prisma") ||
          line.includes("@prisma") ||
          line.includes("bcrypt") ||
          line.includes("jsonwebtoken") ||
          line.includes("redis") ||
          line.includes("supabase")
        ) {
          issues.push({
            file: filePath,
            line: index + 1,
            rule: "Domain Layer Purity",
            message: "Domain layer must not import infrastructure dependencies",
            severity: "error",
          });
        }
      }

      // Application layer checks
      if (layer === "application") {
        if (
          line.includes("express") ||
          line.includes("prisma") ||
          line.includes("@prisma") ||
          line.includes("bcrypt") ||
          line.includes("jsonwebtoken") ||
          line.includes("redis") ||
          line.includes("supabase")
        ) {
          // Allow imports from ports.ts
          if (!line.includes("./ports")) {
            issues.push({
              file: filePath,
              line: index + 1,
              rule: "Application Layer Isolation",
              message:
                "Application layer should only depend on domain and ports",
              severity: "error",
            });
          }
        }
      }

      // Check for cross-module internal imports
      if (line.includes("../../../modules/") && !line.includes("/index")) {
        issues.push({
          file: filePath,
          line: index + 1,
          rule: "Module Boundaries",
          message: "Cross-module imports must use public API (index.ts)",
          severity: "error",
        });
      }
    }
  });
}

// Helper to check module structure
function checkModuleStructure(modulePath: string) {
  const requiredDirs = ["domain", "application", "infrastructure", "interface"];
  const hasIndex = fs.existsSync(path.join(modulePath, "index.ts"));

  if (!hasIndex) {
    issues.push({
      file: modulePath,
      line: 0,
      rule: "Module Structure",
      message: "Module must have index.ts as public API",
      severity: "error",
    });
  }

  requiredDirs.forEach((dir) => {
    const dirPath = path.join(modulePath, dir);
    if (!fs.existsSync(dirPath)) {
      issues.push({
        file: modulePath,
        line: 0,
        rule: "Module Structure",
        message: `Module must have ${dir}/ directory`,
        severity: "warning",
      });
    }
  });
}

function scanDirectory(dirPath: string, layer?: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Determine layer from directory name
      const newLayer = [
        "domain",
        "application",
        "infrastructure",
        "interface",
      ].includes(entry.name)
        ? entry.name
        : layer;

      scanDirectory(fullPath, newLayer);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (layer) {
        checkImports(fullPath, layer, content);
      }
    }
  }
}

function main() {
  console.log("🔍 Checking architecture compliance...\n");

  const modulesPath = path.join(process.cwd(), "src", "modules");

  if (!fs.existsSync(modulesPath)) {
    console.log("❌ No modules/ directory found");
    return;
  }

  // Check each module
  const modules = fs
    .readdirSync(modulesPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const module of modules) {
    const modulePath = path.join(modulesPath, module.name);
    console.log(`Checking module: ${module.name}`);
    checkModuleStructure(modulePath);
    scanDirectory(modulePath);
  }

  // Report issues
  console.log("\n" + "=".repeat(60));

  if (issues.length === 0) {
    console.log("✅ All checks passed! Architecture is compliant.\n");
    return;
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} error(s):\n`);
    errors.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`  Rule: ${issue.rule}`);
      console.log(`  ${issue.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`  Rule: ${issue.rule}`);
      console.log(`  ${issue.message}\n`);
    });
  }

  console.log("=".repeat(60));
  console.log(
    `\nSummary: ${errors.length} errors, ${warnings.length} warnings`,
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
