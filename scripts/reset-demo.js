/**
 * Prints browser console commands to reset demo data for full feature testing.
 * Run: npm run reset-demo
 */
console.log(`
Reset demo data (paste in browser DevTools console while on http://localhost:3000):

[
  'ph_products',
  'ph_orders',
  'ph_customers',
  'ph_cart',
  'ph_current_user',
  'ph_users',
  'ph_wishlist'
].forEach(k => localStorage.removeItem(k));
sessionStorage.removeItem('ph_admin_logged_in');
sessionStorage.removeItem('ph_admin_email');
location.reload();

Or open: http://localhost:3000/reset-demo.html
`);
