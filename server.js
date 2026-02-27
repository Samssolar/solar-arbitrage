import express from "express";
import Stripe from "stripe";
import { Resend } from "resend";

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

app.get("/", (req, res) => {
  res.send("Solar backend running");
});


/*
CREATE CHECKOUT SESSION
*/
app.post("/api/create-checkout-session", async (req, res) => {
  try {

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Solar Arbitrage Report",
            },
            unit_amount: 1999, // $19.99
          },
          quantity: 1,
        },
      ],

      success_url:
        "https://solar-arbitrage-frontend.onrender.com/success.html?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        "https://solar-arbitrage-frontend.onrender.com/cancel.html",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


/*
SEND REPORT EMAIL
*/
app.post("/api/send-report", async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    await resend.emails.send({
      from: "Solar Arbitrage <onboarding@resend.dev>",
      to: email,
      subject: "Your Solar Arbitrage Report",
      html: `
        <h2>Your report is ready</h2>
        <p>Download here:</p>
        <a href="https://solar-arbitrage-frontend.onrender.com/report.pdf">
        Download Report
        </a>
      `,
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});