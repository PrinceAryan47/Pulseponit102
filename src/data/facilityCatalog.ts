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
  },
  // Nairobi, Kenya Facilities
  {
    name: "The Nairobi Hospital",
    address: "Argwings Kodhek Road, Upper Hill, Nairobi, Kenya",
    type: "hospital",
    phone: "+254 20 2845000",
    openingHours: "24/7 Emergency Service",
    services: ["Emergency Trauma Unit", "Cardiology", "Intensive Care Unit", "Pediatrics", "Robotic Surgery"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Nairobi+Hospital+Nairobi",
    lat: -1.2974,
    lng: 36.8048,
    reviews: ["Premier private tertiary referral hospital in East Africa with state-of-the-art facilities."]
  },
  {
    name: "Kenyatta National Hospital",
    address: "Hospital Road, Upper Hill, Nairobi, Kenya",
    type: "hospital",
    phone: "+254 20 2726300",
    openingHours: "24/7 Emergency Service",
    services: ["National Level 6 Referral", "Trauma & Burn Center", "Neurosurgery", "Oncology", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kenyatta+National+Hospital+Nairobi",
    lat: -1.3013,
    lng: 36.8066,
    reviews: ["Largest teaching referral hospital in East Africa with comprehensive multi-specialty coverage."]
  },
  {
    name: "Aga Khan University Hospital, Nairobi",
    address: "3rd Parklands Avenue, Limuru Road, Nairobi, Kenya",
    type: "hospital",
    phone: "+254 20 3662000",
    openingHours: "24/7 Emergency & Inpatient",
    services: ["Heart and Cancer Center", "Advanced Diagnostics", "Neonatal ICU", "Ambulance Dispatch"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Aga+Khan+University+Hospital+Nairobi",
    lat: -1.2619,
    lng: 36.8242,
    reviews: ["Joint Commission International (JCI) accredited hospital known for exceptional specialist care."]
  },
  {
    name: "Goodlife Pharmacy Sarit Centre",
    address: "Sarit Centre, Karuna Road, Westlands, Nairobi, Kenya",
    type: "pharmacy",
    phone: "+254 709 119000",
    openingHours: "8:00 AM - 10:00 PM",
    services: ["Prescription Dispensing", "Chronic Medication Management", "Health Screening"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Goodlife+Pharmacy+Sarit+Centre+Nairobi",
    lat: -1.2612,
    lng: 36.8042,
    reviews: ["Well-stocked retail pharmacy chain with qualified dispensing pharmacists."]
  },

  // Kigali, Rwanda Facilities
  {
    name: "King Faisal Hospital Rwanda",
    address: "KG 544 St, Gasabo, Kigali, Rwanda",
    type: "hospital",
    phone: "+250 252 588888",
    openingHours: "24/7 Emergency Service",
    services: ["Emergency Medicine", "Cardiology", "Nephrology & Dialysis", "Surgical Oncology", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=King+Faisal+Hospital+Kigali",
    lat: -1.9441,
    lng: 30.0939,
    reviews: ["Leading multi-specialty referral facility in Rwanda offering specialized tertiary care."]
  },
  {
    name: "Centre Hospitalier Universitaire de Kigali (CHUK)",
    address: "KN 4 Ave, Nyarugenge, Kigali, Rwanda",
    type: "hospital",
    phone: "+250 252 575555",
    openingHours: "24/7 Emergency Service",
    services: ["University Referral", "Trauma Care", "Obstetrics", "Infectious Diseases", "Pediatrics"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=CHUK+Kigali",
    lat: -1.9547,
    lng: 30.0601,
    reviews: ["Rwanda's central public academic hospital for trauma and specialist intervention."]
  },

  // Dar es Salaam, Tanzania Facilities
  {
    name: "Muhimbili National Hospital",
    address: "Kalenga St, Upanga West, Dar es Salaam, Tanzania",
    type: "hospital",
    phone: "+255 22 2151367",
    openingHours: "24/7 Emergency Service",
    services: ["National Referral", "Cardiac Care (JKCI)", "Trauma Resuscitation", "Nephrology", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Muhimbili+National+Hospital+Dar+es+Salaam",
    lat: -6.8044,
    lng: 39.2747,
    reviews: ["National tertiary apex hospital with premier cardiac and trauma centers."]
  },
  {
    name: "Aga Khan Hospital Dar es Salaam",
    address: "Ocean Road, Upanga, Dar es Salaam, Tanzania",
    type: "hospital",
    phone: "+255 22 2115151",
    openingHours: "24/7 Emergency & Urgent Care",
    services: ["Emergency Trauma", "Interventional Cardiology", "Oncology", "Advanced Imaging"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Aga+Khan+Hospital+Dar+es+Salaam",
    lat: -6.8092,
    lng: 39.2882,
    reviews: ["JCI-accredited modern private medical center with quick emergency response."]
  },

  // Lagos, Nigeria Facilities
  {
    name: "Lagos University Teaching Hospital (LUTH)",
    address: "Ishaga Road, Idi-Araba, Surulere, Lagos, Nigeria",
    type: "hospital",
    phone: "+234 1 7745341",
    openingHours: "24/7 Emergency Service",
    services: ["Trauma Center", "Cardiothoracic Surgery", "Oncology", "Pediatrics", "Adult ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=LUTH+Idi-Araba+Lagos",
    lat: 6.5192,
    lng: 3.3562,
    reviews: ["Major tertiary teaching hospital with extensive emergency and surgical capacity."]
  },
  {
    name: "Reddington Multi-Specialist Hospital",
    address: "12 Idowu Martins Street, Victoria Island, Lagos, Nigeria",
    type: "hospital",
    phone: "+234 1 2715341",
    openingHours: "24/7 Emergency & ICU",
    services: ["Emergency Care", "Cardiac Centre", "Endoscopy", "Dialysis Unit", "Digital Radiology"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Reddington+Hospital+Victoria+Island+Lagos",
    lat: 6.4312,
    lng: 3.4243,
    reviews: ["Top-tier private hospital serving Victoria Island and Lekki corridor."]
  },

  // Johannesburg, South Africa Facilities
  {
    name: "Charlotte Maxeke Johannesburg Academic Hospital",
    address: "Jubilee Road, Parktown, Johannesburg, South Africa",
    type: "hospital",
    phone: "+27 11 488 4911",
    openingHours: "24/7 Emergency Service",
    services: ["Level 1 Trauma Unit", "Organ Transplants", "Cardiology", "Burn Care", "Critical Care"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Charlotte+Maxeke+Hospital+Johannesburg",
    lat: -26.1772,
    lng: 28.0435,
    reviews: ["Central academic referral institution affiliated with University of the Witwatersrand."]
  },
  {
    name: "Netcare Milpark Hospital",
    address: "9 Guild Road, Parktown West, Johannesburg, South Africa",
    type: "hospital",
    phone: "+27 11 480 5600",
    openingHours: "24/7 Emergency Trauma",
    services: ["Accredited Level 1 Trauma Center", "Cardiac Catheterization", "Burns Unit", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Netcare+Milpark+Hospital+Johannesburg",
    lat: -26.1824,
    lng: 28.0163,
    reviews: ["Renowned private emergency trauma center with dedicated helipad."]
  },

  // London, United Kingdom Facilities
  {
    name: "St Thomas' Hospital",
    address: "Westminster Bridge Road, Lambeth, London SE1 7EH, United Kingdom",
    type: "hospital",
    phone: "+44 20 7188 7188",
    openingHours: "24/7 A&E Emergency Department",
    services: ["Major Trauma Center", "Cardiovascular Care", "Pediatrics (Evelina London)", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=St+Thomas+Hospital+London",
    lat: 51.4988,
    lng: -0.1192,
    reviews: ["World-renowned NHS Foundation Trust hospital directly opposite the Houses of Parliament."]
  },
  {
    name: "University College Hospital (UCLH)",
    address: "235 Euston Road, Fitzrovia, London NW1 2BU, United Kingdom",
    type: "hospital",
    phone: "+44 20 3456 7890",
    openingHours: "24/7 Accident & Emergency",
    services: ["Emergency Medicine", "Cancer Centre", "Neurology", "Clinical Trials", "Critical Care"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=University+College+Hospital+London",
    lat: 51.5247,
    lng: -0.1362,
    reviews: ["Premier academic medical centre in central London with rapid A&E triage."]
  },
  {
    name: "Boots Pharmacy Piccadilly Circus",
    address: "44-46 Regent Street, Piccadilly Circus, London W1B 5RA, United Kingdom",
    type: "pharmacy",
    phone: "+44 20 7734 6126",
    openingHours: "8:00 AM - 11:00 PM",
    services: ["Emergency Prescriptions", "Travel Health", "Minor Ailments Service", "Rapid Dispensing"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Boots+Piccadilly+Circus+London",
    lat: 51.5101,
    lng: -0.1347,
    reviews: ["Central London flagship pharmacy with comprehensive medication stock."]
  },

  // New York, United States Facilities
  {
    name: "NewYork-Presbyterian / Weill Cornell Medical Center",
    address: "525 East 68th Street, New York, NY 10065, United States",
    type: "hospital",
    phone: "+1 212-746-5454",
    openingHours: "24/7 Emergency Room",
    services: ["Level 1 Adult & Pediatric Trauma", "Burn Center", "Cardiology", "Neurological Institute", "ICU"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=NewYork-Presbyterian+Hospital+NYC",
    lat: 40.7646,
    lng: -73.9542,
    reviews: ["Consistently ranked among the top medical institutions in the United States."]
  },
  {
    name: "Mount Sinai Hospital",
    address: "1468 Madison Avenue, New York, NY 10029, United States",
    type: "hospital",
    phone: "+1 212-241-6500",
    openingHours: "24/7 Emergency Department",
    services: ["Emergency Trauma", "Gastroenterology", "Geriatrics", "Cardiac Care", "Surgical Suites"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mount+Sinai+Hospital+New+York",
    lat: 40.7900,
    lng: -73.9527,
    reviews: ["Internationally recognized academic hospital offering comprehensive emergency medicine."]
  },
  {
    name: "Duane Reade / Walgreens Pharmacy Herald Square",
    address: "1350 Broadway, New York, NY 10018, United States",
    type: "pharmacy",
    phone: "+1 212-695-6346",
    openingHours: "24/7 Open Daily",
    services: ["24/7 Pharmacy Dispensing", "Vaccinations", "Health Testing", "OTC Medicine"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Duane+Reade+Herald+Square+NYC",
    lat: 40.7516,
    lng: -73.9877,
    reviews: ["24-hour pharmacy with registered pharmacists on staff around the clock."]
  },

  // New Delhi, India Facilities
  {
    name: "All India Institute of Medical Sciences (AIIMS)",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029, India",
    type: "hospital",
    phone: "+91 11 2658 8500",
    openingHours: "24/7 Emergency Medicine",
    services: ["Apex Medical Institute", "Trauma Centre", "Cardiology", "Neurology", "Transplantation"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=AIIMS+New+Delhi",
    lat: 28.5672,
    lng: 77.2100,
    reviews: ["India's premier public medical research university and national hospital."]
  },
  {
    name: "Max Super Speciality Hospital Saket",
    address: "1 2, Press Enclave Marg, Saket Institutional Area, New Delhi 110017, India",
    type: "hospital",
    phone: "+91 11 2651 5050",
    openingHours: "24/7 Emergency & ICU",
    services: ["Emergency Resuscitation", "Interventional Cardiology", "Oncology", "Robotic Surgery"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Max+Super+Speciality+Hospital+Saket+New+Delhi",
    lat: 28.5286,
    lng: 77.2126,
    reviews: ["NABH and NABL accredited super-speciality facility with high clinical standards."]
  },

  // Dubai, United Arab Emirates Facilities
  {
    name: "Rashid Hospital",
    address: "315 Umm Hurair Second, Oud Metha Road, Dubai, UAE",
    type: "hospital",
    phone: "+971 4 219 2000",
    openingHours: "24/7 Trauma & Emergency",
    services: ["Level 1 Trauma Center", "Emergency Intensive Care", "Cardiology", "Surgical Theatres"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rashid+Hospital+Dubai",
    lat: 25.2444,
    lng: 55.3211,
    reviews: ["Flagship government emergency and trauma care center in Dubai."]
  },
  {
    name: "American Hospital Dubai",
    address: "19th Street, Oud Metha, Bur Dubai, Dubai, UAE",
    type: "hospital",
    phone: "+971 4 377 5500",
    openingHours: "24/7 Emergency Department",
    services: ["Emergency Care", "Heart Center", "Cancer Care", "Orthopedics", "Pediatrics"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=American+Hospital+Dubai",
    lat: 25.2343,
    lng: 55.3168,
    reviews: ["Member of the Mayo Clinic Care Network with premier American-standard private care."]
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
