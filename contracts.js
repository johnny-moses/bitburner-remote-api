function addOperators(digits, target) {
    const res = [];
    const addOperatorsRecursive = (pos, path, num, sum, prevNum) => {
        if (pos === digits.length) { // end of string reached
            if (num === target) {
                res.push(path);
            }
            return;
        }
        let currNum = 0;
        for (let i = pos; i < digits.length; i++) {
            if (digits[pos] === '0' && i !== pos) // no leading 0's allowed
                break;
            currNum = currNum * 10 + parseInt(digits[i]); // increment operand
            let nextPath = '';
            if (pos === 0) { // start of string, just add operand
                addOperatorsRecursive(i + 1, currNum + '', currNum, sum + currNum, currNum);
            } else {
                nextPath = path + '+' + currNum; // addition case
                addOperatorsRecursive(i + 1, nextPath, sum + currNum, sum + currNum, currNum);
                nextPath = path + '-' + currNum; // subtraction case
                addOperatorsRecursive(i + 1, nextPath, sum - currNum, sum - currNum, -currNum);
                // multiplication case
                nextPath = path + '*' + currNum;
                // multiplication is a special case
                // we remove the last num added to sum and add the multiplied result
                addOperatorsRecursive(i + 1, nextPath, (sum - prevNum) + prevNum * currNum, sum - prevNum + prevNum * currNum, prevNum * currNum);
            }
        }
    }
    addOperatorsRecursive(0, '', 0, 0, 0);
    return res;
}

let input = ["9261575319", 50];
console.log(addOperators(...input));