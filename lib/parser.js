export function parseExpense(message) {
  const lines = message.split("\n");

  const expenses = lines.map(line => {
    const parts = line.trim().split(" ");

    return {
      amount: parseFloat(parts[0]),
      item: parts[1],
      category: parts[2],
      payment: parts[3]
    };
  });

  return expenses;
}