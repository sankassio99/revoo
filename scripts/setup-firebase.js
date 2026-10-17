
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!credentialsJson) {
  throw new Error(
    "Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable"
  );
}

// Validate the JSON before writing it.
const credentials = JSON.parse(credentialsJson);

if (
  credentials.type !== "service_account" ||
  !credentials.project_id ||
  !credentials.private_key ||
  !credentials.client_email
) {
  throw new Error("Invalid Firebase service account JSON");
}

const directory = path.join(process.cwd(), "firebase-auth");
const filePath = path.join(directory, "service-account.json");

fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(filePath, JSON.stringify(credentials), {
  encoding: "utf8",
  mode: 0o600,
});

console.log("Firebase service account file created successfully.");
