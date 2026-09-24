import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function updateAccountData() {
  console.log("=== UPDATING FIREBASE ACCOUNT INFORMATION ===");

  // 1. Update Mafia Lord's account in users collection
  const mafiaLordUid = "KYWTWst97hRPnweUXMfjdVuSAXB3";
  const userRef = doc(db, "users", mafiaLordUid);
  
  const existingUserSnap = await getDoc(userRef);
  if (existingUserSnap.exists()) {
    console.log("Found Mafia Lord user doc:", existingUserSnap.data().email);
    await updateDoc(userRef, {
      role: "admin",
      status: "approved",
      lastSeen: serverTimestamp()
    });
    console.log("Updated Mafia Lord role to admin and status to approved.");
  } else {
    console.log("Creating Mafia Lord user doc...");
    await setDoc(userRef, {
      uid: mafiaLordUid,
      email: "mafialord1247@gmail.com",
      fullName: "Mafia Lord",
      role: "admin",
      status: "approved",
      isOnline: true,
      phoneNumber: "+256 780293572",
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    });
  }

  // 2. Ensure both mafia.lord1247@gmail.com and mafialord1247@gmail.com are registered in emails collection
  const emailAliases = [
    { email: "mafialord1247@gmail.com", uid: mafiaLordUid },
    { email: "mafia.lord1247@gmail.com", uid: mafiaLordUid },
    { email: "tukeijer@gmail.com", uid: "5tfWwAo2P6f5a8NbcbyxSFtDe3H2" }
  ];

  for (const item of emailAliases) {
    const emailRef = doc(db, "emails", item.email);
    await setDoc(emailRef, {
      email: item.email,
      uid: item.uid,
      createdAt: serverTimestamp()
    }, { merge: true });
    console.log(`Registered email in registry: ${item.email} -> UID ${item.uid}`);
  }

  console.log("Firebase account information update complete!");
  process.exit(0);
}

updateAccountData().catch(err => {
  console.error("Failed to update account data:", err);
  process.exit(1);
});
