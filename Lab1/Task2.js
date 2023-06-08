// Task 2
function filterArray(arr, fn) {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (fn(arr[i], i)) {
        result.push(arr[i]);
      }
    }
    return result;
  }

// Example usage
const arr = [0,10,20,30];
const fn = function greaterThan10(n) { return n > 10; };
const filteredArr = filterArray(arr, fn);
console.log(filteredArr); // Output: [20, 30]
