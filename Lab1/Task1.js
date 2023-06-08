// Task 1
Array.prototype.last = function() {
    if (this.length == 0) return -1;
    else return this[this.length-1]
};

// Example usage
sum = [1, 2, 3, 4, 100500];
console.log(sum.last()) // Output: 100500
