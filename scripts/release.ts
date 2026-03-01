import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const oldVersion = pkg.version;

console.log(`Current version: ${oldVersion}`);

// Helper to calculate next versions
const [major, minor, patch] = oldVersion.split('.').map(Number);
const nextPatch = `${major}.${minor}.${patch + 1}`;
const nextMinor = `${major}.${minor + 1}.0`;
const nextMajor = `${major + 1}.0.0`;

console.log(`
Select release type:
1. patch (${nextPatch})
2. minor (${nextMinor})
3. major (${nextMajor})
4. manuel
`);

const choice = prompt('Choice (1-4):');
let newVersion: string | null = '';

switch (choice) {
  case '1':
    newVersion = nextPatch;
    break;
  case '2':
    newVersion = nextMinor;
    break;
  case '3':
    newVersion = nextMajor;
    break;
  case '4':
    newVersion = prompt('Enter new version:');
    break;
  default:
    console.log('Invalid choice. Aborted.');
    process.exit(1);
}

if (!newVersion) {
  console.log('Aborted.');
  process.exit(1);
}

const confirmVersion = prompt(`Update all files to version ${newVersion}? (y/N)`, 'n');
if (confirmVersion?.toLowerCase() !== 'y') {
  console.log('Aborted.');
  process.exit(1);
}

// 1. Update package.json
pkg.version = newVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// 2. Update docs/zolt.project.yaml
const yamlPath = path.join(process.cwd(), 'docs/zolt.project.yaml');
try {
  let yaml = readFileSync(yamlPath, 'utf-8');
  yaml = yaml.replace(/version: .*/, `version: ${newVersion}`);
  writeFileSync(yamlPath, yaml);
} catch (_e) {
  console.warn('Could not update docs/zolt.project.yaml');
}

// 3. Update README.md
const readmePath = path.join(process.cwd(), 'README.md');
try {
  let readme = readFileSync(readmePath, 'utf-8');
  // Match version-X.X.X-blue or version-X.X-blue
  readme = readme.replace(/version-[0-9.]+-blue/g, `version-${newVersion}-blue`);
  writeFileSync(readmePath, readme);
} catch (_e) {
  console.warn('Could not update README.md');
}

console.log('✅ Files updated.');

// 4. Commit
const confirmCommit = prompt(`Commit changes with message "chore: release v${newVersion}"? (y/N)`, 'n');
if (confirmCommit?.toLowerCase() === 'y') {
  execSync('git add package.json docs/zolt.project.yaml README.md');
  execSync(`git commit -m "chore: release v${newVersion}"`);
  console.log('✅ Committed.');
} else {
  console.log('Aborted.');
  process.exit(1);
}

// 5. Push Commit
const confirmPush = prompt('Push commit to remote? (y/N)', 'n');
if (confirmPush?.toLowerCase() === 'y') {
  try {
    execSync('git push');
    console.log('✅ Pushed.');
  } catch (_e) {
    console.error('❌ Push failed, but continuing...');
  }
} else {
  console.log('Push skipped.');
}

// 6. Tag
const confirmTag = prompt(`Create git tag v${newVersion}? (y/N)`, 'n');
if (confirmTag?.toLowerCase() === 'y') {
  execSync(`git tag v${newVersion}`);
  console.log('✅ Tag created.');
} else {
  console.log('Aborted.');
  process.exit(1);
}

// 7. Push Tag
const confirmPushTag = prompt(`Push tag v${newVersion} to remote? (y/N)`, 'n');
if (confirmPushTag?.toLowerCase() === 'y') {
  try {
    execSync('git push --tags');
    console.log('✅ Tags pushed.');
  } catch (_e) {
    console.error('❌ Tag push failed.');
  }
} else {
  console.log('Tag push skipped.');
}

console.log(`\n🎉 Release v${newVersion} finished!`);
