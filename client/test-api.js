// Test script to verify API URLs are working correctly
const { buildApiUrl } = require('./utils/formatters.ts');

console.log('Testing buildApiUrl function:');
console.log('Empty string:', buildApiUrl(''));
console.log('API path:', buildApiUrl('api/analytics/user'));
console.log('Full path:', buildApiUrl('/api/performance/metrics'));
console.log('With query:', buildApiUrl('api/images?page=1'));

// Test with production URL
process.env.NEXT_PUBLIC_API_URL = 'https://pixelsqueeze.onrender.com';
console.log('\nWith production URL:');
console.log('Empty string:', buildApiUrl(''));
console.log('API path:', buildApiUrl('api/analytics/user'));
console.log('Full path:', buildApiUrl('/api/performance/metrics'));
