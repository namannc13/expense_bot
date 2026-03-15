import { supabase } from "./supabase";

export async function deleteExpense(id) {

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return "Failed to delete expense ❌";
  }

  return `Deleted expense ${id} ✅`;
}


export async function undoLastExpense() {

  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, item")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data.length) {
    return "Nothing to undo ❌";
  }

  const last = data[0];

  await supabase
    .from("expenses")
    .delete()
    .eq("id", last.id);

  return `Undone ₹${last.amount} ${last.item} ✅`;
}


export async function listExpenses(limit = 10) {

  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, item, category")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return "Error fetching expenses ❌";
  }

  if (!data.length) {
    return "No expenses found";
  }

  let message = "Recent expenses\n\n";

  data.forEach(row => {
    message += `${row.id} • ₹${row.amount} ${row.item} (${row.category})\n`;
  });

  return message;
}


export async function getTopCategories() {

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category");

  if (error) {
    console.error(error);
    return "Error fetching data ❌";
  }

  const totals = {};

  data.forEach(row => {

    const cat = row.category || "Other";

    totals[cat] = (totals[cat] || 0) + Number(row.amount);
  });

  const sorted = Object.entries(totals)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5);

  let message = "Top categories\n\n";

  sorted.forEach(([cat,val])=>{
    message += `${cat}: ₹${val}\n`;
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
    return "Error fetching category ❌";
  }

  if (!data.length) {
    return `No expenses for ${category}`;
  }

  const total = data.reduce(
    (s,e)=>s+Number(e.amount),
    0
  );

  let message = `${category} spending\n\nTotal: ₹${total}\n\n`;

  data.slice(0,5).forEach(row=>{
    message += `₹${row.amount} ${row.item}\n`;
  });

  return message;
}


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
    return "Error fetching analytics ❌";
  }

  const title =
    range.charAt(0).toUpperCase() + range.slice(1) + " spending";

  return buildMessage(title, data || []);
}