import twilio from "twilio";
import { supabase } from "@/lib/supabase";
import { parseExpenses } from "@/lib/parser";

import {
  getAnalyticsByRange,
  listExpenses,
  deleteExpense,
  undoLastExpense,
  getTopCategories,
  getCategoryAnalytics
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
    headers: { "Content-Type": "text/xml" }
  });
}


async function handleCommand(command, rawMessage) {

  // range analytics
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

  // category analytics
  if (isCategory(command)) {
    return getCategoryAnalytics(command);
  }

  // otherwise parse expenses
  return saveExpenses(rawMessage);
}


async function saveExpenses(message) {

  const expenses = parseExpenses(message);

  if (!expenses.length) {
    return "Invalid format ❌\nExample:\n45 auto travel upi";
  }

  const { error } = await supabase
    .from("expenses")
    .insert(expenses);

  if (error) {
    console.error(error);
    return "Failed to save expense ❌";
  }

  return `Saved ${expenses.length} expense(s) ✅`;
}


function isCategory(command) {

  const categories = [
    "food",
    "travel",
    "shopping",
    "entertainment",
    "bills",
    "health"
  ];

  return categories.includes(command);
}