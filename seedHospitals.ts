import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const seedHospitals = async () => {
  const hospitals = [
    {
      name: "Mulago National Referral Hospital",
      licenseNumber: "HOSP-UG-001",
      address: "Mulago Hill, Kampala, Uganda",
      contactPhone: "+256 414 554001",
      contactEmail: "info@mulago.or.ug",
      services: ["General Surgery", "Internal Medicine", "Pediatrics", "Obstetrics & Gynecology", "Emergency"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1587350859728-117699f4a1ec?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3378, lng: 32.5761 }
    },
    {
      name: "Nakasero Hospital",
      licenseNumber: "HOSP-UG-002",
      address: "Plot 14A Akii Bua Rd, Kampala, Uganda",
      contactPhone: "+256 312 531300",
      contactEmail: "info@nhl.co.ug",
      services: ["Cardiology", "Neurology", "Oncology", "Emergency", "Diagnostics"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3265, lng: 32.5815 }
    },
    {
      name: "International Hospital Kampala (IHK)",
      licenseNumber: "HOSP-UG-004",
      address: "Plot 4686 Barnabas Rd, Namuwongo, Kampala",
      contactPhone: "+256 312 200400",
      contactEmail: "info@img.co.ug",
      services: ["Emergency Medicine", "Intensive Care", "Surgery", "Maternity", "ICU"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3015, lng: 32.6105 }
    },
    {
      name: "St. Francis Hospital Nsambya",
      licenseNumber: "HOSP-UG-005",
      address: "Nsambya Hill, Kampala, Uganda",
      contactPhone: "+256 414 267012",
      contactEmail: "info@nsambyahospital.or.ug",
      services: ["Obstetrics", "Gynecology", "Pediatrics", "Surgery", "Maternity"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3012, lng: 32.5878 }
    },
    {
      name: "Case Hospital",
      licenseNumber: "HOSP-UG-003",
      address: "Plot 69/71 Buganda Rd, Kampala, Uganda",
      contactPhone: "+256 312 250700",
      contactEmail: "info@casemedicalcentre.com",
      services: ["Dermatology", "Orthopedics", "Radiology", "General Practice", "Emergency", "Dental"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1538108197017-c13466739195?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3242, lng: 32.5786 }
    },
    {
      name: "Uganda Martyrs Hospital Lubaga",
      licenseNumber: "HOSP-UG-006",
      address: "Lubaga Hill, Kampala, Uganda",
      contactPhone: "+256 414 270221",
      contactEmail: "info@lubagahospital.org",
      services: ["General Medicine", "Surgery", "Maternity", "Pediatrics"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3025, lng: 32.5535 }
    },
    {
      name: "Mengo Hospital",
      licenseNumber: "HOSP-UG-007",
      address: "Namirembe Hill, Kampala, Uganda",
      contactPhone: "+256 414 270222",
      contactEmail: "info@mengohospital.org",
      services: ["Dental", "Eye Care", "Surgery", "Maternity", "Pediatrics"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3125, lng: 32.5595 }
    },
    {
      name: "Kibuli Muslim Hospital",
      licenseNumber: "HOSP-UG-008",
      address: "Kibuli Hill, Kampala, Uganda",
      contactPhone: "+256 414 235296",
      contactEmail: "info@kibulihospital.org",
      services: ["General Medicine", "Surgery", "Maternity", "Diagnostics"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.3085, lng: 32.5975 }
    },
    {
      name: "Gulu Regional Referral Hospital",
      licenseNumber: "HOSP-UG-009",
      address: "Gulu City, Northern Uganda",
      contactPhone: "+256 471 432021",
      contactEmail: "info@guluhospital.go.ug",
      services: ["General Surgery", "Pediatrics", "Maternity", "Emergency"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1587350859728-117699f4a1ec?auto=format&fit=crop&q=80&w=800",
      location: { lat: 2.7725, lng: 32.3005 }
    },
    {
      name: "Mbarara Regional Referral Hospital",
      licenseNumber: "HOSP-UG-010",
      address: "Mbarara City, Western Uganda",
      contactPhone: "+256 485 420020",
      contactEmail: "info@mbararahospital.go.ug",
      services: ["Surgery", "Internal Medicine", "Pediatrics", "Obstetrics"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800",
      location: { lat: -0.6125, lng: 30.6555 }
    },
    {
      name: "Jinja Regional Referral Hospital",
      licenseNumber: "HOSP-UG-011",
      address: "Jinja City, Eastern Uganda",
      contactPhone: "+256 434 120011",
      contactEmail: "info@jinjahospital.go.ug",
      services: ["Emergency", "Surgery", "Maternity", "Pediatrics"],
      openingHours: "24/7",
      photoURL: "https://images.unsplash.com/photo-1538108197017-c13466739195?auto=format&fit=crop&q=80&w=800",
      location: { lat: 0.4265, lng: 33.2045 }
    }
  ];

  try {
    console.log("Clearing existing hospitals...");
    const querySnapshot = await getDocs(collection(db, 'hospitals'));
    for (const hospitalDoc of querySnapshot.docs) {
      await deleteDoc(doc(db, 'hospitals', hospitalDoc.id));
    }
    
    console.log("Seeding hospitals with coordinates...");
    for (const hospital of hospitals) {
      await addDoc(collection(db, 'hospitals'), hospital);
    }
    console.log("Hospitals seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding hospitals:", error);
    process.exit(1);
  }
};

seedHospitals();
