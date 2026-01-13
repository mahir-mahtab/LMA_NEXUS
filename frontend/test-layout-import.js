// Quick test to verify layout components can be imported
const React = require('react');

try {
  // Test if the components can be imported without errors
  console.log('Testing layout component imports...');
  
  // This would fail if there are syntax errors
  require('./src/components/layout/Sidebar.tsx');
  require('./src/components/layout/SidebarItem.tsx');
  require('./src/components/layout/TopBar.tsx');
  require('./src/components/layout/Breadcrumbs.tsx');
  require('./src/components/layout/UserMenu.tsx');
  require('./src/components/layout/ThemeToggle.tsx');
  require('./src/components/layout/AccessGate.tsx');
  
  console.log('✅ All layout components imported successfully!');
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}