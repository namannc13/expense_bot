import db from "./db";

export function getAnalytics() {

  const total = db.prepare(`
    SELECT SUM(amount) as total FROM expenses
  `).get();

  const byCategory = db.prepare(`
    SELECT category, SUM(amount) as total
    FROM expenses
    GROUP BY category
  `).all();

  let response = `Total Spent: ₹${total.total}\n\n`;

  byCategory.forEach(c => {
    response += `${c.category}: ₹${c.total}\n`;
  });

  return response;
}