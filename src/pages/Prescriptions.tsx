import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MedicalRecord } from '../types';
import { 
  Pill, 
  Clock, 
  Calendar, 
  User, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';

const Prescriptions: React.FC = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const qField = profile.role === 'patient' ? 'patientId' : 'doctorId';
    const q = query(
      collection(db, 'medicalRecords'),
      where(qField, '==', profile.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      // Filter records that have prescriptions
      setRecords(snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as unknown as MedicalRecord))
        .filter(r => r.prescription && r.prescription.trim() !== '')
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <GuestOverlay
      title="My Prescriptions"
      description="Sign in to view and manage your active medications and historical prescriptions."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[rgb(var(--foreground))] mb-4 tracking-tight neon-text">My Prescriptions</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          View and manage your active medications and historical prescriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {records.length > 0 ? records.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                      <Pill className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[rgb(var(--foreground))]">{record.diagnosis}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Prescribed by {record.doctorName}</p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full uppercase tracking-widest">
                    Active
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Medication Details</p>
                  <p className="text-lg font-medium text-[rgb(var(--foreground))] whitespace-pre-wrap">
                    {record.prescription}
                  </p>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issued: {format(new Date(record.date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Duration: 7 Days</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <button className="text-sm font-bold text-neon-blue hover:underline flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button className="text-sm font-bold text-slate-400 hover:text-[rgb(var(--foreground))] transition-colors">
                  Refill Request
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <Pill className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">No prescriptions found</h3>
              <p className="text-slate-500 dark:text-slate-400">Your prescribed medications will appear here.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Safety Reminders
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Take medications exactly as prescribed by your doctor.</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Do not skip doses or stop early without consultation.</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Report any unexpected side effects immediately.</p>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-neon-blue to-purple-600 p-8 rounded-3xl text-white shadow-xl shadow-neon-blue/20">
            <h2 className="text-xl font-bold mb-4">Need a Refill?</h2>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">
              You can request a prescription refill directly from your doctor via chat or by booking a quick follow-up.
            </p>
            <button className="w-full py-3 bg-white text-neon-blue rounded-xl font-bold hover:bg-slate-50 transition-colors">
              Contact Doctor
            </button>
          </div>
        </div>
      </div>
      </div>
    </GuestOverlay>
  );
};

export default Prescriptions;
