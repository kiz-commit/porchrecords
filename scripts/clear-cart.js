// Simple script to clear cart data from localStorage
// Run this in the browser console to clear cart immediately

console.log('🧹 Clearing Porch Records cart data...');

try {
  // Clear cart from localStorage
  localStorage.removeItem('porch-cart');
  console.log('✅ Cart data cleared from localStorage');
  
  // Clear order completion marker from sessionStorage
  sessionStorage.removeItem('last-order-time');
  console.log('✅ Order completion marker cleared from sessionStorage');
  
  // Reload the page to reset cart state
  console.log('🔄 Reloading page to reset cart state...');
  window.location.reload();
  
} catch (error) {
  console.error('❌ Error clearing cart data:', error);
} 