import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {

  const formData = await req.formData();
  const message = formData.get("Body");

  console.log("Incoming message:", message);

  const twiml = new twilio.twiml.MessagingResponse();

  if (message?.toLowerCase() === "get") {
    twiml.message("Analytics feature coming soon 📊");
  } else {
    twiml.message("Expense received ✅");
  }

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}