const Agenda = require("agenda");
const dotenv = require("dotenv");
dotenv.config();

let mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "test";
if (mongoUri.includes('?')) {
  const parts = mongoUri.split('?');
  mongoUri = `${parts[0]}${dbName}?${parts[1]}`;
} else {
  mongoUri = `${mongoUri}/${dbName}`;
}

const agenda = new Agenda({ db: { address: mongoUri, collection: "agendaJobs" } });

agenda.on('ready', () => {
  console.log('✅ Agenda started successfully');
  agenda.start();
});

agenda.on('error', (err) => {
  console.error('❌ Agenda connection error:', err);
});

module.exports = agenda;
