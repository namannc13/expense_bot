import { supabase } from "./supabase";

export async function isValidCategory(category) {
  const { data, error } = await supabase.from("expenses").select("category");

  if (error) {
    console.error(error);
    return false;
  }

  const categories = [...new Set(data.map((r) => r.category?.toLowerCase()))];

  return categories.includes(category);
}

export async function deleteExpense(id) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    console.error(error);
    return "❌ Failed to delete expense";
  }

  return `🗑️ *Expense Deleted*

ID: ${id}`;
}

export async function undoLastExpense() {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, item")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data.length) {
    return "❌ Nothing to undo";
  }

  const last = data[0];

  await supabase.from("expenses").delete().eq("id", last.id);

  return `↩️ *Last Expense Removed*

₹${last.amount} • ${last.item}`;
}

export async function listExpenses(limit = 10) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, item, category")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return "❌ Error fetching expenses";
  }

  if (!data.length) {
    return "📭 No expenses found";
  }

  let message = `🧾 *Recent Expenses*
━━━━━━━━━━━━━━

`;

  data.forEach((row) => {
    message += `#${row.id}  ₹${row.amount}
🛒 ${row.item}
📂 ${row.category}

`;
  });

  return message;
}

export async function getTopCategories() {
  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category");

  if (error) {
    console.error(error);
    return "❌ Error fetching data";
  }

  const totals = {};

  data.forEach((row) => {
    const cat = row.category || "Other";

    totals[cat] = (totals[cat] || 0) + Number(row.amount);
  });

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let message = `🏆 *Top Spending Categories*
━━━━━━━━━━━━━━

`;

  sorted.forEach(([cat, val], index) => {
    message += `${index + 1}. ${cat} — ₹${val}
`;
  });

  return message;
}

export async function getCategoryAnalytics(category) {
  const { data, error } = await supabase
    .from("expenses")
    .select("amount, item")
    .ilike("category", category);

  if (error) {
    console.error(error);
    return "❌ Error fetching category";
  }

  if (!data.length) {
    return `📭 No expenses for ${category}`;
  }

  const total = data.reduce((s, e) => s + Number(e.amount), 0);

  let message = `📂 *${category.toUpperCase()} Spending*
━━━━━━━━━━━━━━

`;

  message += `💰 Total: ₹${total}

`;

  message += `🧾 Recent
`;

  data.slice(0, 5).forEach((row) => {
    message += `• ₹${row.amount} ${row.item}
`;
  });

  return message;
}

function buildMessage(title, rows) {
  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  const categoryTotals = {};

  rows.forEach((row) => {
    const category = row.category || "Other";

    categoryTotals[category] =
      (categoryTotals[category] || 0) + Number(row.amount);
  });

  let message = `📊 *${title}*
━━━━━━━━━━━━━━

`;

  message += `💰 Total Spent
₹${total}

`;

  message += `📂 By Category
`;

  for (const cat in categoryTotals) {
    message += `• ${cat}: ₹${categoryTotals[cat]}
`;
  }

  return message;
}

export async function getAnalyticsByRange(range) {
  let startDate = new Date();

  if (range === "today") {
    startDate.setHours(0, 0, 0, 0);
  }

  if (range === "week") {
    startDate.setDate(startDate.getDate() - 7);
  }

  if (range === "month") {
    startDate.setDate(1);
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category, created_at")
    .gte("created_at", startDate.toISOString());

  if (error) {
    console.error(error);
    return "❌ Error fetching analytics";
  }

  const title = range.charAt(0).toUpperCase() + range.slice(1) + " Spending";

  return buildMessage(title, data || []);
}

export async function getSummary() {
  const startDate = new Date();
  startDate.setDate(1);

  const { data } = await supabase
    .from("expenses")
    .select("amount, category")
    .gte("created_at", startDate.toISOString());

  if (!data.length) return "📭 No expenses this month";

  const total = data.reduce((s, e) => s + Number(e.amount), 0);

  const categories = {};

  data.forEach((row) => {
    const cat = row.category || "Other";
    categories[cat] = (categories[cat] || 0) + Number(row.amount);
  });

  let message = `📊 *Monthly Summary*
━━━━━━━━━━━━━━

`;

  message += `💰 Total Spent
₹${total}

`;

  message += `📂 Categories
`;

  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, val]) => {
      message += `• ${cat}: ₹${val}
`;
    });

  return message;
}

export async function getDailyAverage() {
  const startDate = new Date();
  startDate.setDate(1);

  const { data } = await supabase
    .from("expenses")
    .select("amount, created_at")
    .gte("created_at", startDate.toISOString());

  if (!data.length) return "📭 No spending data";

  const total = data.reduce((s, e) => s + Number(e.amount), 0);

  const today = new Date();
  const days = today.getDate();

  const avg = Math.round(total / days);

  let message = `📅 *Daily Spending Average*
━━━━━━━━━━━━━━

`;

  message += `💰 Total This Month: ₹${total}
`;
  message += `📊 Avg / Day: ₹${avg}
`;
  message += `📆 Days Counted: ${days}`;

  return message;
}

export async function compareMonthSpending() {
  const now = new Date();

  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { data } = await supabase.from("expenses").select("amount, created_at");

  let thisMonth = 0;
  let lastMonth = 0;

  data.forEach((row) => {
    const date = new Date(row.created_at);
    const amt = Number(row.amount);

    if (date >= startThisMonth) thisMonth += amt;

    if (date >= startLastMonth && date <= endLastMonth) lastMonth += amt;
  });

  const diff = thisMonth - lastMonth;

  const trend = diff > 0 ? "📈 Increased" : "📉 Decreased";

  let message = `⚔️ *Month Comparison*
━━━━━━━━━━━━━━

`;

  message += `📅 This Month: ₹${thisMonth}
`;
  message += `📅 Last Month: ₹${lastMonth}

`;

  message += `${trend} by ₹${Math.abs(diff)}`;

  return message;
}
