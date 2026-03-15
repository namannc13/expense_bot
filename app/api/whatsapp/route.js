import { supabase } from "@/lib/supabase";
import twilio from "twilio";

export const runtime = "nodejs";

export async function POST(req) {

  const formData = await req.formData();
  const message = formData.get("Body");

  const twiml = new twilio.twiml.MessagingResponse();

  if (message.toLowerCase() === "get") {

    const { data } = await supabase
      .from("expenses")
      .select("*");

    const total = data.reduce((s,e)=>s+e.amount,0);

    twiml.message(`Total spent ₹${total}`);

  } else {

    const [amount,item,category,payment] = message.split(" ");
    
    console.log(amount)
    console.log(item)

    const { data, error } = await supabase
        .from("expenses")
        .insert([
            {
            amount,
            item,
            category,
            payment
            }
        ]);

    if (error) {
        console.log("Insert error:", error);
    }

    twiml.message("Expense saved ✅");
  }

  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}