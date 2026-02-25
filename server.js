const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const PDF_FOLDER = path.join(__dirname, 'pdfs');

if (!fs.existsSync(PDF_FOLDER)) {
  fs.mkdirSync(PDF_FOLDER);
}

app.use('/pdfs', express.static(PDF_FOLDER));


function generatePDF(data, filename){

  return new Promise((resolve, reject)=>{

    const filePath = path.join(PDF_FOLDER, filename);

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(22)
      .text("Solar Arbitrage Advisor Report", {align:"center"});

    doc.moveDown();

    doc.fontSize(14)
      .text(`Email: ${data.email}`)
      .text(`Daily consumption: ${data.dailyConsumption || "unknown"} kWh`)
      .text(`Solar export: ${data.export || "unknown"} kWh/day`)
      .text(`Estimated recoverable value: $${data.savings || "unknown"} / year`);

    doc.moveDown();

    doc.text("Recommendations:");

    doc.moveDown();

    doc.text("• Run hot water between 10am and 3pm");
    doc.text("• Charge EV during solar production");
    doc.text("• Shift dishwasher and laundry to solar hours");
    doc.text("• Consider timers or smart relays");

    doc.end();

    stream.on("finish", ()=> resolve());
    stream.on("error", reject);

  });

}


async function sendEmail(email, filename){

  await resend.emails.send({

    from: "Solar Advisor <onboarding@resend.dev>",

    to: email,

    subject: "Your Solar Report",

    html:
    `
    <h2>Your report is ready</h2>

    <p>Download it here:</p>

    <a href="https://solar-backend-6e2q.onrender.com/pdfs/${filename}">
    Download Report
    </a>
    `
  });

}


app.post("/create-checkout-session", async (req,res)=>{

  try{

    const data = req.body;

    const filename =
      "report-" + Date.now() + ".pdf";

    await generatePDF(data, filename);

    await sendEmail(data.email, filename);

    const session =
      await stripe.checkout.sessions.create({

      payment_method_types:["card"],

      line_items:[
        {
          price_data:{
            currency:"aud",
            product_data:{
              name:"Solar Arbitrage Report"
            },
            unit_amount:3900
          },
          quantity:1
        }
      ],

      mode:"payment",

      success_url:
        `https://meek-choux-acc1fc.netlify.app/success.html?file=${filename}`,

      cancel_url:
        `https://meek-choux-acc1fc.netlify.app/`

    });

    res.json({id:session.id});

  }
  catch(err){

    console.log(err);

    res.status(500).json({
      error:err.message
    });

  }

});


const PORT =
  process.env.PORT || 4242;

app.listen(PORT, ()=>{
  console.log("Server running on port",PORT);
});