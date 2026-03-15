import db from "@/lib/db";
import { parseExpense } from "@/lib/parser";
import { getAnalytics } from "@/lib/analytics";
import twilio from "twilio";

export async function POST(req) {

  const body = await req.text();
  const params = new URLSearchParams(body);

  const message = params.get("Body");

  if (message.toLowerCase() === "get") {

    const analytics = getAnalytics();

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(analytics);

    return new Response(twiml.toString(), {
      headers: { "Content-Type": "text/xml" }
    });

  }

  const expenses = parseExpense(message);

  expenses.forEach(exp => {

    db.prepare(`
      INSERT INTO expenses (amount, item, category, payment)
      VALUES (?, ?, ?, ?)
    `).run(
      exp.amount,
      exp.item,
      exp.category,
      exp.payment
    );

  });

  const twiml = new twilio.twiml.MessagingResponse();

  twiml.message("Expense Added ✅");

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}