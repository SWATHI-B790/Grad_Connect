const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Banner = require("./models/Banner");

dotenv.config();

const clean = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/connect_in");
    
    // Delete any banner matching cyber or phishing
    const deleted = await Banner.deleteMany({
      $or: [
        { title: { $regex: "cyber", $options: "i" } },
        { title: { $regex: "phishing", $options: "i" } },
        { subtitle: { $regex: "cyber", $options: "i" } },
        { description: { $regex: "cyber", $options: "i" } },
        { ctaText: { $regex: "cyber", $options: "i" } },
      ],
    });
    console.log(`Deleted ${deleted.deletedCount} cybersecurity banners.`);

    const remaining = await Banner.find();
    console.log("Current Banners in DB:", remaining.map(b => b.title));

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clean();
