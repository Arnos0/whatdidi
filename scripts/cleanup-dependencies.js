#!/usr/bin/env node

/**
 * Cleanup script to remove unused dependencies and optimize package.json
 * Run with: node scripts/cleanup-dependencies.js
 */

const fs = require('fs')
const path = require('path')

const packageJsonPath = path.join(__dirname, '../package.json')

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Dependencies to remove (confirmed unused)
const dependenciesToRemove = [
  'react-hot-toast',  // Replaced with Sonner
  '@heroicons/react', // Using Lucide React instead
  'vaul'              // Not being used
]

// Dev dependencies to remove (if any)
const devDependenciesToRemove = [
  // Add any unused dev dependencies here
]

// Remove unused dependencies
dependenciesToRemove.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`Removing unused dependency: ${dep}`)
    delete packageJson.dependencies[dep]
  }
})

devDependenciesToRemove.forEach(dep => {
  if (packageJson.devDependencies[dep]) {
    console.log(`Removing unused dev dependency: ${dep}`)
    delete packageJson.devDependencies[dep]
  }
})

// Sort dependencies alphabetically for better maintainability
if (packageJson.dependencies) {
  const sortedDeps = {}
  Object.keys(packageJson.dependencies).sort().forEach(key => {
    sortedDeps[key] = packageJson.dependencies[key]
  })
  packageJson.dependencies = sortedDeps
}

if (packageJson.devDependencies) {
  const sortedDevDeps = {}
  Object.keys(packageJson.devDependencies).sort().forEach(key => {
    sortedDevDeps[key] = packageJson.devDependencies[key]
  })
  packageJson.devDependencies = sortedDevDeps
}

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

console.log('✅ Cleanup completed!')
console.log('📦 Dependencies cleaned up and sorted alphabetically')
console.log('🔧 Run "npm install" to update package-lock.json')

// Create a summary of changes
const summary = {
  removed: {
    dependencies: dependenciesToRemove.filter(dep => packageJson.dependencies && !packageJson.dependencies[dep]),
    devDependencies: devDependenciesToRemove.filter(dep => packageJson.devDependencies && !packageJson.devDependencies[dep])
  },
  remaining: {
    dependencies: Object.keys(packageJson.dependencies || {}),
    devDependencies: Object.keys(packageJson.devDependencies || {})
  }
}

console.log('\n📊 Summary:')
console.log(`   Removed ${summary.removed.dependencies.length} unused dependencies`)
console.log(`   Removed ${summary.removed.devDependencies.length} unused dev dependencies`)
console.log(`   Total dependencies: ${summary.remaining.dependencies.length}`)
console.log(`   Total dev dependencies: ${summary.remaining.devDependencies.length}`)

if (summary.removed.dependencies.length > 0) {
  console.log('\n🗑️  Removed dependencies:')
  summary.removed.dependencies.forEach(dep => console.log(`   - ${dep}`))
}