// controllers/contactController.js
const emailQueue = require("../queues/emailQueue");

const sendEmailNotification = async (contact) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL, // Your email address to receive notifications
    subject: "RadioIQ - Contact Form Submission",
    text: `You have received a new contact form submission:\n\nName: ${contact.name}\nEmail: ${contact.email}\nComment: ${contact.comment}`,
  };

  await emailQueue.add("sendEmail", mailOptions);
};

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, comment } = req.body;

    console.log("Received contact form submission:", { name, email, comment });

    // Add email job to the queue
    await sendEmailNotification({ name, email, comment });

    res.status(201).json({ message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
  }
};
