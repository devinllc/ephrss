const mongoose = require("mongoose");
require("dotenv").config();

async function cleanIndices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://incrypto09:VcFzmdvSgSbqHx5m@transcoding.jcngo.mongodb.net/empowerhrstest?retryWrites=true&w=majority&appName=transcoding");
        console.log("Connected to DB");

        const collection = mongoose.connection.collection("attendances");
        const indexes = await collection.indexes();
        console.log("Current Indexes:", JSON.stringify(indexes, null, 2));

        // Let's drop the problematic index if it exists
        const redundantIndices = ["student_1", "lecture_1", "course_1", "markedAt_1", "student_1_lecture_1"];
        for (const idxName of redundantIndices) {
            try {
                if (indexes.some(idx => idx.name === idxName)) {
                    console.log(`Dropping redundant index: ${idxName}`);
                    await collection.dropIndex(idxName);
                }
            } catch (e) {
                console.warn(`Could not drop ${idxName}: ${e.message}`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}

cleanIndices();
