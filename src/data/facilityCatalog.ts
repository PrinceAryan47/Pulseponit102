import { NearbyFacility } from '../services/locationService';

export interface CatalogFacility extends NearbyFacility {
  phone: string;
  openingHours: string;
  services: string[];
  reviews: string[];
  lat: number;
  lng: number;
}

export const COMPREHENSIVE_FACILITIES_CATALOG: CatalogFacility[] = [
  {
    name: "Mulago National Referral Hospital",
    address: "Mulago Hill Road, Kampala, Uganda",
    type: "hospital",
    phone: "+256 414 554001",
    openingHours: "24/7 Emergency Service",
    services: ["General Surgery", "Internal Medicine", "Pediatrics", "Emergency Trauma Unit", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mulago+National+Referral+Hospital+Kampala",
    lat: 0.3378,
    lng: 32.5761,
    reviews: ["Uganda's premier national referral hospital with 24/7 trauma & emergency care.", "Extensive specialist consultants."]
  },
  {
    name: "Nakasero Hospital",
    address: "Plot 14A Akii Bua Road, Nakasero, Kampala, Uganda",
    type: "hospital",
    phone: "+256 312 531300",
    openingHours: "24/7 Emergency & Inpatient",
    services: ["Cardiology", "Neurology", "Oncology", "Critical Care", "Advanced Diagnostics"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nakasero+Hospital+Kampala",
    lat: 0.3265,
    lng: 32.5815,
    reviews: ["Google Rating: 4.5 ⭐", "Clean, modern private facility with brief wait times and expert specialists."]
  },
  {
    name: "International Hospital Kampala (IHK)",
    address: "Plot 4686 Barnabas Road, Namuwongo, Kampala, Uganda",
    type: "hospital",
    phone: "+256 312 200400",
    openingHours: "24/7 Emergency & ICU",
    services: ["Emergency Medicine", "Intensive Care Unit", "Surgical Theatre", "Maternity", "Ambulance"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=International+Hospital+Kampala",
    lat: 0.3015,
    lng: 32.6105,
    reviews: ["Well-equipped emergency department and high standard of nursing."]
  },
  {
    name: "St. Francis Hospital Nsambya",
    address: "Nsambya Hill, Ggaba Road, Kampala, Uganda",
    type: "hospital",
    phone: "+256 414 267012",
    openingHours: "24/7 Emergency Service",
    services: ["Obstetrics & Gynecology", "Pediatrics", "General Surgery", "Dialysis Unit"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=St.+Francis+Hospital+Nsambya+Kampala",
    lat: 0.3012,
    lng: 32.5878,
    reviews: ["Renowned maternal, pediatric and emergency services on Nsambya Hill."]
  },
  {
    name: "Case Medical Centre / Hospital",
    address: "Plot 69/71 Buganda Road, Kampala, Uganda",
    type: "clinic",
    phone: "+256 312 250700",
    openingHours: "24/7 Emergency Desk",
    services: ["Emergency Triage", "Dermatology", "Orthopedics", "Digital Radiology", "Dental"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Case+Medical+Centre+Kampala",
    lat: 0.3242,
    lng: 32.5786,
    reviews: ["Very responsive central location with full on-site lab and urgent care."]
  },
  {
    name: "The Surgery Uganda",
    address: "Plot 21 Luthuli Avenue, Bugolobi, Kampala, Uganda",
    type: "clinic",
    phone: "+256 312 256001",
    openingHours: "24/7 Emergency & Ambulance",
    services: ["24/7 Urgent Care", "Mobile Ambulance Dispatch", "Travel Clinic & Vaccines", "Minor Surgeries"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Surgery+Uganda+Kampala",
    lat: 0.3168,
    lng: 32.6105,
    reviews: ["Highly rated emergency dispatch and international medical care."]
  },
  {
    name: "Uganda Martyrs Hospital Lubaga",
    address: "Lubaga Hill Road, Kampala, Uganda",
    type: "hospital",
    phone: "+256 414 270221",
    openingHours: "24/7 Emergency Service",
    services: ["Emergency Trauma", "Maternity & Neonatal", "General Surgery", "Pediatrics"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Uganda+Martyrs+Hospital+Lubaga",
    lat: 0.3025,
    lng: 32.5535,
    reviews: ["Historic referral hospital with dedicated emergency and pediatric wards."]
  },
  {
    name: "Mengo Hospital",
    address: "Namirembe Hill, Kampala, Uganda",
    type: "hospital",
    phone: "+256 414 270222",
    openingHours: "24/7 Emergency Service",
    services: ["Emergency", "Dental Care", "Ophthalmology / Eye Care", "Surgical Services"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mengo+Hospital+Kampala",
    lat: 0.3125,
    lng: 32.5595,
    reviews: ["Excellent eye clinic, dental center, and general inpatient care."]
  },
  {
    name: "Kibuli Muslim Hospital",
    address: "Kibuli Hill, Kampala, Uganda",
    type: "hospital",
    phone: "+256 414 235296",
    openingHours: "24/7 Emergency Service",
    services: ["General Medicine", "Emergency Surgery", "Maternity", "Pathology Diagnostics"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kibuli+Muslim+Hospital+Kampala",
    lat: 0.3085,
    lng: 32.5975,
    reviews: ["Prompt attention, compassionate nurses, and comprehensive diagnostics."]
  },
  {
    name: "Kampala Hospital Kololo",
    address: "Plot 6 Shimon Road, Kololo, Kampala, Uganda",
    type: "hospital",
    phone: "+256 414 344990",
    openingHours: "24/7 Emergency & Imaging",
    services: ["Inpatient Care", "CT & MRI Scanning", "Emergency Room", "Specialist Consultations"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kampala+Hospital+Kololo",
    lat: 0.3315,
    lng: 32.5912,
    reviews: ["State-of-the-art diagnostic imaging scanners and serene environment."]
  },
  {
    name: "First Pharmacy Wandegeya",
    address: "Plot 12 Bombo Road, Wandegeya, Kampala, Uganda",
    type: "pharmacy",
    phone: "+256 414 532100",
    openingHours: "24/7 Open All Week",
    services: ["Prescription Dispensing", "Over-the-Counter Medication", "Emergency Medical Supplies", "Blood Pressure Checks"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=First+Pharmacy+Wandegeya+Kampala",
    lat: 0.3320,
    lng: 32.5730,
    reviews: ["Fully stocked 24-hour pharmacy with certified pharmacists on duty."]
  },
  {
    name: "Guardian Health Pharmacy",
    address: "Plot 24 Kampala Road, Central Division, Kampala, Uganda",
    type: "pharmacy",
    phone: "+256 393 208888",
    openingHours: "Mon-Sun: 7:30 AM - 10:00 PM",
    services: ["Prescription Drugs", "Medical Consultation", "Diabetes Monitoring", "Vitamins & Wellness"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Guardian+Health+Pharmacy+Kampala+Road",
    lat: 0.3138,
    lng: 32.5810,
    reviews: ["Reliable chain pharmacy with high product standards and knowledgeable staff."]
  },
  {
    name: "Jubilee Dental Clinic",
    address: "Plot 30 Jinja Road, Kampala, Uganda",
    type: "dental",
    phone: "+256 312 263690",
    openingHours: "Mon-Sat: 8:00 AM - 7:00 PM",
    services: ["Emergency Tooth Relief", "Dental Implants", "Orthodontics", "Digital Dental X-Rays"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jubilee+Dental+Clinic+Kampala",
    lat: 0.3155,
    lng: 32.5892,
    reviews: ["Google Rating: 4.8 ⭐", "Painless dentistry, gentle practitioners, and hygienic operatory suites."]
  },
  {
    name: "Pan Dental Surgery Kololo",
    address: "Plot 4 Acacia Avenue, Kololo, Kampala, Uganda",
    type: "dental",
    phone: "+256 414 345678",
    openingHours: "Mon-Sat: 8:00 AM - 8:00 PM",
    services: ["Root Canals", "Cosmetic Dentistry", "Teeth Whitening", "Oral Surgery"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Pan+Dental+Surgery+Acacia+Avenue+Kampala",
    lat: 0.3352,
    lng: 32.5878,
    reviews: ["Leading dental care provider with specialists in cosmetic dentistry."]
  },
  {
    name: "Kampala Imaging Centre (KIC)",
    address: "Plot 12 George Street, Central Division, Kampala, Uganda",
    type: "diagnostic",
    phone: "+256 414 345000",
    openingHours: "24/7 Diagnostic Imaging",
    services: ["3D/4D Ultrasound", "High-Field MRI", "64-Slice CT Scan", "Digital Mammography", "Bone Densitometry"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kampala+Imaging+Centre+George+Street",
    lat: 0.3204,
    lng: 32.5755,
    reviews: ["Instant diagnostic reporting, clean facilities, and modern radiological imaging equipment."]
  },
  {
    name: "Lancet Laboratories Uganda",
    address: "Plot 61-67 Buganda Road, Kampala, Uganda",
    type: "diagnostic",
    phone: "+256 414 346511",
    openingHours: "Mon-Sat: 7:00 AM - 7:00 PM",
    services: ["Pathology & Blood Analysis", "Histology", "Microbiology", "Genetic Testing", "Corporate Health Screening"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lancet+Laboratories+Buganda+Road+Kampala",
    lat: 0.3238,
    lng: 32.5790,
    reviews: ["ISO 15189 accredited lab. Fast, digital test results accessible securely online."]
  },
  {
    name: "Children's Clinic Kampala",
    address: "Plot 15 Yusuf Lule Road, Kampala, Uganda",
    type: "specialty",
    phone: "+256 414 250123",
    openingHours: "Mon-Sun: 8:00 AM - 8:00 PM",
    services: ["Pediatric Emergency", "Newborn Immunization", "Child Growth Tracking", "Pediatric Allergy & Asthma"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Childrens+Clinic+Yusuf+Lule+Kampala",
    lat: 0.3290,
    lng: 32.5855,
    reviews: ["Child-friendly environment with caring pediatric consultants."]
  },
  {
    name: "Uganda Heart Institute (UHI)",
    address: "Mulago Hospital Complex, Mulago Hill, Kampala, Uganda",
    type: "specialty",
    phone: "+256 414 541589",
    openingHours: "24/7 Cardiac Emergency",
    services: ["Emergency Angioplasty", "Cardiac Catheterization", "Echocardiogram", "Open Heart Surgery"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Uganda+Heart+Institute+Mulago",
    lat: 0.3385,
    lng: 32.5772,
    reviews: ["Center of excellence for cardiology, cardiothoracic surgery, and intensive cardiac care."]
  },
  {
    name: "Jinja Regional Referral Hospital",
    address: "Clifton Road, Jinja, Uganda",
    type: "hospital",
    phone: "+256 434 120022",
    openingHours: "24/7 Emergency Service",
    services: ["Tertiary Referral", "Emergency Trauma", "Surgical Department", "Maternity"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jinja+Regional+Referral+Hospital",
    lat: 0.4283,
    lng: 33.2045,
    reviews: ["Large-scale public medical center in Eastern Uganda."]
  },
  {
    name: "Mbarara Regional Referral Hospital",
    address: "Mbarara-Kabale Road, Mbarara, Uganda",
    type: "hospital",
    phone: "+256 485 420020",
    openingHours: "24/7 Emergency Service",
    services: ["Major Teaching Hospital", "Regional Referral", "Trauma Unit", "Neonatal Intensive Care"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mbarara+Regional+Referral+Hospital",
    lat: -0.6151,
    lng: 30.6558,
    reviews: ["Major teaching and referral hospital serving Western Uganda."]
  },
  {
    name: "Gulu Regional Referral Hospital",
    address: "Hospital Road, Gulu, Uganda",
    type: "hospital",
    phone: "+256 471 432021",
    openingHours: "24/7 Emergency Service",
    services: ["Trauma Center", "Emergency Care", "Pediatric Wing", "Maternity"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gulu+Regional+Referral+Hospital",
    lat: 2.7725,
    lng: 32.3006,
    reviews: ["Primary public referral health center in Northern Uganda."]
  },
  {
    name: "St. Mary's Hospital Lacor",
    address: "Gulu-Nimule Road, Gulu, Uganda",
    type: "hospital",
    phone: "+256 471 435002",
    openingHours: "24/7 Emergency Service",
    services: ["Affordable Emergency Care", "Laboratory Diagnostics", "Surgical Theatres", "Intensive Care"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=St.+Marys+Hospital+Lacor+Gulu",
    lat: 2.7611,
    lng: 32.2589,
    reviews: ["Award-winning mission hospital known for high quality and affordable healthcare."]
  }
];

export const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

export const formatDistance = (meters: number): string => {
  if (meters > 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
};

export const estimateDriveTime = (meters: number): string => {
  // Average urban speed: ~25-30 km/h (about 450 meters per minute)
  const minutes = Math.max(1, Math.round(meters / 450));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }
  return `${minutes} min${minutes > 1 ? 's' : ''}`;
};
