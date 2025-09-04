// This file checks if the navigation from cart to checkout is working properly
console.log("Navigation check from cart to checkout");

// Export a function to test navigation
export function testNavigation(navigate: (path: string) => void) {
  console.log("Navigating to /checkout");
  navigate("/checkout");
}
