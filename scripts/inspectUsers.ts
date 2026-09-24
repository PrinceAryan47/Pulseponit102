import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectUsers() {
  const snap = await getDocs(collection(db, "users"));
  console.log(`Total users found: ${snap.size}`);
  
  const users = [];
  snap.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      uid: data.uid,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      status: data.status,
      phoneNumber: data.phoneNumber,
      gender: data.gender,
      age: data.age,
      licenseNumber: data.licenseNumber,
      specialization: data.specialization,
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      isOnline: data.isOnline,
      createdAt: data.createdAt,
      lastSeen: data.lastSeen,
      hasPhotoURL: !!data.photoURL,
      photoURLLength: data.photoURL ? data.photoURL.length : 0
    });
  });

  console.log(JSON.stringify(users, null, 2));
}

inspectUsers();
