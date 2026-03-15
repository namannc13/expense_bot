export function parseExpenses(message) {

  const lines = message
    .trim()
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const expenses = lines.map(line => {

    const parts = line.split(/\s+/);

    return {
      amount: Number(parts[0]),
      item: parts[1] || "",
      category: parts[2] || "",
      payment: parts[3] || ""
    };

  });

  return expenses;
}