import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Stethoscope, 
  Hospital, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  Users,
  Calendar,
  Heart,
  LifeBuoy,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAppSetting } from '../services/settingsService';
import { collection, getCountFromServer, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Home: React.FC = () => {
  // Use a high-quality medical image as the initial state
  const [heroImage, setHeroImage] = React.useState('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000');
  const [stats, setStats] = useState({
    totalUsers: 0,
    doctors: 0,
    hospitals: 0
  });

  useEffect(() => {
    const fetchHero = async () => {
      const dbHero = await getAppSetting('heroImage');
      if (dbHero) {
        setHeroImage(dbHero);
      }
    };
    fetchHero();

    // Real-time stats
    let unsubUsers = () => {};
    
    const fetchCounts = async () => {
      try {
        console.log("Fetching counts...");
        const uSnap = await getCountFromServer(collection(db, 'users'));
        console.log("Users count fetched:", uSnap.data().count);
        
        const dSnap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'doctor')));
        console.log("Doctors count fetched:", dSnap.data().count);
        
        const hSnap = await getCountFromServer(collection(db, 'hospitals'));
        console.log("Hospitals count fetched:", hSnap.data().count);
        
        setStats({
          totalUsers: uSnap.data().count,
          doctors: dSnap.data().count,
          hospitals: hSnap.data().count
        });
      } catch (e: any) {
        console.error("Error fetching home stats:", e.message, e.code);
      }
    };

    // Use a public collection to trigger refreshes for guests, or users collection for logged in
    // Hospitals are public, so listening to them is safe for everyone
    unsubUsers = onSnapshot(collection(db, 'hospitals'), () => {
      fetchCounts();
    }, (err) => {
      if (err.code !== 'permission-denied') {
        console.error("Hospitals snapshot error:", err);
      }
    });

    // Also listen to users if logged in for more frequent updates
    let unsubUsersReal = () => {};
    const checkAuthAndListen = () => {
      try {
        // Listen to a small query that is likely to change when users join
        // We use limit(1) to minimize data transfer and permission issues
        unsubUsersReal = onSnapshot(query(collection(db, 'users'), limit(1)), () => {
          fetchCounts();
        }, (err) => {
          // Ignore permission errors for guests
          if (err.code !== 'permission-denied') {
            console.error("Users snapshot error:", err);
          }
        });
      } catch (e) {
        // Ignore
      }
    };
    checkAuthAndListen();

    fetchCounts();

    return () => {
      unsubUsers();
      unsubUsersReal();
    };
  }, []);

  return (
    <div className="overflow-hidden transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-32 bg-background transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,243,255,0.08),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 border border-primary/20">
                <span className="flex h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(0,243,255,1)]"></span>
                PulsePoint: Your Health, Simplified.
              </div>
              <h1 className="text-6xl lg:text-8xl font-black text-foreground leading-[0.9] mb-8 tracking-tighter uppercase">
                Feel <span className="text-primary neon-text">Better</span> <br /> Today.
              </h1>
              <p className="text-2xl text-muted-foreground mb-12 leading-tight max-w-lg font-medium">
                Simple tools to find doctors, hospitals, and stay healthy. No complicated steps.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-10 py-6 bg-primary text-primary-foreground rounded-[2rem] text-xl font-black hover:bg-neon-blue-dark transition-all shadow-2xl shadow-primary/30 group neon-glow uppercase tracking-tighter"
                >
                  Start Here
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>

              {/* Real-time Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border pt-8">
                <div>
                  <p className="text-4xl font-black text-foreground tracking-tighter">{stats.totalUsers}+</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Users</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-primary tracking-tighter">{stats.doctors}+</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Doctors</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-foreground tracking-tighter">{stats.hospitals}+</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Hospitals</p>
                </div>
              </div>
            </motion.div>
            
            <div className="relative order-first lg:order-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-card rotate-3 hover:rotate-0 transition-transform duration-500 bg-muted"
              >
                <img 
                  src={heroImage} 
                  alt="PulsePoint Medical Team" 
                  className="w-full h-[300px] sm:h-[400px] lg:h-[600px] object-cover"
                  referrerPolicy="no-referrer"
                  onLoad={() => console.log('Hero image loaded')}
                  onError={(e) => {
                    console.error('Hero image failed to load');
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1559839734-2b71f1736827?auto=format&fit=crop&q=80&w=1000';
                  }}
                />
              </motion.div>
              {/* Floating Visual Cues */}
              <div className="absolute -top-10 -right-10 z-20 bg-neon-blue p-8 rounded-[2.5rem] shadow-2xl animate-bounce-slow">
                <Heart className="w-16 h-16 text-slate-900 fill-slate-900" />
              </div>
              <div className="absolute -bottom-10 -left-10 z-20 bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border">
                <Activity className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Navigation Grid - "Illiterate Friendly" */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-7xl font-black text-foreground uppercase tracking-tighter mb-4">What do you need?</h2>
            <div className="h-2 w-48 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Find Doctor',
                desc: 'Talk to a specialist',
                icon: Stethoscope,
                path: '/doctors',
                color: 'bg-blue-500',
                shadow: 'shadow-blue-500/20'
              },
              {
                title: 'Check Health',
                desc: 'Calculate BMI & more',
                icon: Activity,
                path: '/health-tools',
                color: 'bg-neon-blue',
                shadow: 'shadow-neon-blue/20'
              },
              {
                title: 'Emergency',
                desc: 'First Aid & Help',
                icon: LifeBuoy,
                path: '/first-aid',
                color: 'bg-red-500',
                shadow: 'shadow-red-500/20'
              },
              {
                title: 'Sign In',
                desc: 'Access your account',
                icon: Users,
                path: '/login',
                color: 'bg-purple-500',
                shadow: 'shadow-purple-500/20'
              }
            ].map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="group relative"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`h-full p-10 rounded-[3rem] ${item.color} ${item.shadow} shadow-2xl transition-all flex flex-col items-center text-center`}
                >
                  <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-md group-hover:scale-110 transition-transform">
                    <item.icon className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{item.title}</h3>
                  <p className="text-white/80 font-bold text-lg">{item.desc}</p>
                  
                  <div className="mt-8 w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-6 h-6 text-slate-900" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3 neon-text">Our Services</h2>
            <h3 className="text-4xl font-bold text-foreground mb-6">Everything you need to manage your health in one place.</h3>
            <p className="text-lg text-muted-foreground">PulsePoint offers a wide range of features designed for patients, doctors, and hospital administrators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Health Utilities',
                desc: 'Calculate BMI, check symptoms, and track daily health metrics with our advanced tools.',
                icon: Activity,
                color: 'bg-primary/10 text-primary'
              },
              {
                title: 'Doctor Directory',
                desc: 'Browse and book appointments with verified specialists across various medical fields.',
                icon: Stethoscope,
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              },
              {
                title: 'Hospital Search',
                desc: 'Find nearby hospitals and medical facilities with detailed services and contact info.',
                icon: Hospital,
                color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
              },
              {
                title: 'Medical Records',
                desc: 'Securely store and access your prescriptions, lab results, and consultation history.',
                icon: Shield,
                color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
              },
              {
                title: 'First Aid Guide',
                desc: 'Immediate, step-by-step instructions for medical emergencies and an AI assistant for quick advice.',
                icon: LifeBuoy,
                color: 'bg-red-500/10 text-red-600 dark:text-red-400'
              },
              {
                title: 'Health Education',
                desc: 'Stay informed with expert articles on nutrition, fitness, and disease prevention.',
                icon: BookOpen,
                color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 -ml-48 -mb-48"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div>
              <p className="text-5xl font-bold mb-2 text-primary">Verified</p>
              <p className="text-slate-400 font-medium">Medical Doctors</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2 text-primary">Partnered</p>
              <p className="text-slate-400 font-medium">Ugandan Hospitals</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2 text-primary">Trusted</p>
              <p className="text-slate-400 font-medium">Patient Community</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2 text-primary">Secure</p>
              <p className="text-slate-400 font-medium">Medical Records</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary/5 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden border border-primary/10">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground mb-6">Ready to take control of your health?</h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of users who are already using PulsePoint to manage their health more effectively.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-neon-blue-dark transition-all shadow-xl shadow-primary/20 neon-glow"
                >
                  Create Your Account
                </Link>
                <Link
                  to="/doctors"
                  className="px-8 py-4 bg-card text-primary border border-primary/20 rounded-2xl font-semibold hover:bg-primary/5 transition-all"
                >
                  Find a Doctor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Re-using Bell icon from lucide-react
const BookOpen = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);

const Bell = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

export default Home;
