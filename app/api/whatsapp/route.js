import twilio from "twilio";
import { supabase } from "@/lib/supabase";
import { parseExpenses } from "@/lib/parser";

import {
  getAnalyticsByRange,
  listExpenses,
  deleteExpense,
  undoLastExpense,
  getTopCategories,
  getCategoryAnalytics,
  getSummary,
  getDailyAverage,
  compareMonthSpending,
  isValidCategory,
} from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req) {
  const formData = await req.formData();
  const message = formData.get("Body")?.trim() || "";

  const command = message.toLowerCase();
  const twiml = new twilio.twiml.MessagingResponse();

  const response = await handleCommand(command, message);

  twiml.message(response);

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

async function handleCommand(command, rawMessage) {
  // analytics ranges
  if (["today", "week", "month"].includes(command)) {
    return getAnalyticsByRange(command);
  }

  // list
  if (command === "list") {
    return listExpenses();
  }

  // delete
  if (command.startsWith("delete")) {
    const id = command.split(" ")[1];

    if (!id) {
      return "Usage:\n delete <id>";
    }

    return deleteExpense(id);
  }

  // undo
  if (command === "undo") {
    return undoLastExpense();
  }

  // top categories
  if (command === "top") {
    return getTopCategories();
  }

  // summary
  if (command === "summary") {
    return getSummary();
  }

  // daily average
  if (command === "average") {
    return getDailyAverage();
  }

  // compare months
  if (command === "compare") {
    return compareMonthSpending();
  }

  // dynamic category analytics
  const categoryCheck = await isValidCategory(command);

  if (categoryCheck) {
    return getCategoryAnalytics(command);
  }

  // otherwise try saving expense
  return saveExpenses(rawMessage);
}

async function saveExpenses(message) {
  const parts = message.trim().split(/\s+/);

  if (parts.length !== 4) {
    return `❌ *Invalid Expense Format*

Required format:
amount item category payment

Example:
50 roll food upi`;
  }

  const expenses = parseExpenses(message);

  if (!expenses.length) {
    return "❌ Could not parse expense";
  }

  const { error } = await supabase.from("expenses").insert(expenses);

  if (error) {
    console.error(error);
    return "❌ Failed to save expense";
  }

  return `✅ *Expense Saved*

${expenses.length} item added`;
}
