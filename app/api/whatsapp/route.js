import twilio from "twilio";
import { supabase } from "@/lib/supabase";
import { parseExpenses } from "@/lib/parser";
import { getAnalyticsByRange } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req) {

    const formData = await req.formData();
    const message = formData.get("Body");

    const twiml = new twilio.twiml.MessagingResponse();

    const command = message.toLowerCase().trim();

    if (["today", "week", "month"].includes(command)) {

        const result = await getAnalyticsByRange(command);

        twiml.message(result);

    }
    else if (command === "get") {

        const result = await getAnalyticsByRange("month");

        twiml.message(result);

    }
    else {

        const expenses = parseExpenses(message);

        const { error } = await supabase
            .from("expenses")
            .insert(expenses);

        if (error) {
            console.error(error);
            twiml.message("Failed to save expense ❌");
        } else {
            twiml.message(`Saved ${expenses.length} expense(s) ✅`);
        }

    }

    return new Response(twiml.toString(), {
        headers: { "Content-Type": "text/xml" }
    });
}