// Task 3
function composeFunctions(functions) {
    if (functions.length === 0) {
      return (x) => x; // Identity function
    }
  
    if (functions.length === 1) {
      return functions[0]; // Return the single function
    }
  
    return functions.reduceRight((f, g) => (x) => g(f(x))); // Compose the functions
  }

// Example usage
const functions = [x => x + 1, x => x * x, x => 2 * x]
const composedFn = composeFunctions(functions);

console.log(composedFn(4)); // Output: 65