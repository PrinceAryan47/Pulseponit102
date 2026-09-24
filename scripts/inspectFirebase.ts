import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const COLLECTIONS = [
  "users",
  "hospitals",
  "appointments",
  "medicalRecords",
  "articles",
  "settings",
  "messages",
  "calls",
  "healthReports",
  "accessRequests",
  "emails",
  "notifications"
];

async function inspectAll() {
  console.log("=== FIREBASE DATABASE INSPECTION ===");
  console.log("Project:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  console.log("====================================\n");

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\n--------------------------------------------------`);
      console.log(`Collection: [${colName}] - Count: ${snap.size}`);
      console.log(`--------------------------------------------------`);
      
      snap.forEach((d) => {
        const data = d.data();
        // Print clean summary of doc, truncating giant base64 photo strings if any
        const cleanData: any = {};
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === "string" && v.startsWith("data:image")) {
            cleanData[k] = `[base64 image, length: ${v.length}]`;
          } else if (typeof v === "string" && v.length > 200) {
            cleanData[k] = v.substring(0, 150) + `... [len: ${v.length}]`;
          } else {
            cleanData[k] = v;
          }
        }
        console.log(`ID: ${d.id} =>`, JSON.stringify(cleanData, null, 2));
      });
    } catch (err: any) {
      console.error(`Error reading collection ${colName}:`, err.message || err);
    }
  }

  process.exit(0);
}

inspectAll();
