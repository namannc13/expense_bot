import { supabase } from "./supabase";

function buildMessage(title, rows) {

  const total = rows.reduce(
    (sum, r) => sum + Number(r.amount),
    0
  );

  const categoryTotals = {};

  rows.forEach(row => {
    const category = row.category || "Other";

    categoryTotals[category] =
      (categoryTotals[category] || 0) + Number(row.amount);
  });

  let message = `${title}\n\nTotal: ₹${total}\n\n`;

  for (const cat in categoryTotals) {
    message += `${cat}: ₹${categoryTotals[cat]}\n`;
  }

  return message;
}

export async function getAnalyticsByRange(range) {

  let startDate = new Date();

  if (range === "today") {

    startDate.setHours(0,0,0,0);

  } else if (range === "week") {

    startDate.setDate(startDate.getDate() - 7);

  } else if (range === "month") {

    startDate.setDate(1);

  }

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category, created_at")
    .gte("created_at", startDate.toISOString());

  if (error) {
    console.error(error);
    return "Error fetching analytics ❌";
  }

  const title =
    range.charAt(0).toUpperCase() + range.slice(1) + " spending";

  return buildMessage(title, data || []);
}