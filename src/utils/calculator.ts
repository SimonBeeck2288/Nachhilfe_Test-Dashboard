export function calculateResult(firstOperand: number, secondOperand: number, operator: string): number | 'Fehler' {
  switch (operator) {
    case '+':
      return firstOperand + secondOperand;
    case '-':
      return firstOperand - secondOperand;
    case '*':
      return firstOperand * secondOperand;
    case '/':
      if (secondOperand === 0) {
        return 'Fehler';
      }
      return firstOperand / secondOperand;
    default:
      return secondOperand;
  }
}

export function formatCalculatorNumber(val: number): string {
  if (!isFinite(val) || isNaN(val)) {
    return 'Fehler';
  }
  // Round to max 8 decimal places avoiding floating precision issues (e.g. 0.1 + 0.2 = 0.3)
  const rounded = Math.round(val * 1e8) / 1e8;
  return String(rounded).replace('.', ',');
}
