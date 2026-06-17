import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  LogIn, 
  Loader2, 
  Phone, 
  RefreshCcw, 
  ArrowRight,
  Bus,
  Clock,
  Navigation,
  Shield,
  Activity,
  Users,
  Route as RouteIcon,
  Crosshair
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import MapPreview from '../../components/MapPreview';

export default function Login({ darkMode }) {
  const [activeTab, setActiveTab] = useState('email'); 
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login, setUpRecaptcha, signInWithPhone, currentUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Email States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  // Email Login Handler
  async function handleEmailSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password, rememberMe);
      toast.success('Access Granted!');
      navigate('/');
    } catch (err) {
      toast.error('Authentication Failed. Check credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Phone Auth Step 1: Send OTP
  async function handleSendOTP(e) {
    e.preventDefault();
    if (phoneNumber.length < 10) return toast.error('Enter valid phone number');

    try {
      setLoading(true);
      const appVerifier = setUpRecaptcha('recaptcha-container');
      let formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`; 
      
      const confirmationResult = await signInWithPhone(formattedPhone, appVerifier);
      setVerificationId(confirmationResult);
      setOtpSent(true);
      setCountdown(60);
      toast.success('Security code sent via SMS');
    } catch (err) {
      toast.error('Failed to send OTP. Try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Phone Auth Step 2: Verify OTP
  async function handleVerifyOTP(e) {
    e.preventDefault();
    if (otp.length < 6) return toast.error('Enter 6-digit code');

    try {
      setLoading(true);
      await verificationId.confirm(otp);
      toast.success('Mobile Verified Successfully!');
      navigate('/');
    } catch (err) {
      toast.error('Invalid Verification Code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-4 rounded-2xl">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-lg font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#0A0C10]">
      
      {/* LEFT SECTION: Branding & Simulation */}
      <div className="relative md:w-3/5 min-h-[400px] md:min-h-screen flex flex-col justify-end p-8 md:p-16 overflow-hidden">
        {/* Background Animation Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 z-10" />
          <MapPreview />
        </div>

        {/* Content Layer */}
        <div className="relative z-20 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Bus className="text-white w-7 h-7" />
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">UniTrans</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">UniTrans</span>
            </h1>
            
            <p className="text-xl text-white/60 mb-12 font-medium leading-relaxed max-w-xl">
              Track campus buses in real time with live GPS, ETA predictions, and smart route intelligence.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-16">
              {[
                { icon: Navigation, text: "Live Bus Tracking" },
                { icon: Crosshair, text: "Real-Time GPS Updates" },
                { icon: Clock, text: "Smart ETA Prediction" },
                { icon: Shield, text: "Campus Security System" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3 text-white/80 font-bold text-sm">
                  <feature.icon className="w-5 h-5 text-blue-500" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Bus} label="Active Buses" value="4" />
              <StatCard icon={RouteIcon} label="Active Routes" value="12" />
              <StatCard icon={Users} label="Students" value="500+" />
              <StatCard icon={Activity} label="Accuracy" value="99%" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SECTION: Auth Container */}
      <div className="md:w-2/5 min-h-screen flex items-center justify-center p-6 bg-[#0F1115] relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-form p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-[20px] bg-white/[0.03]"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white mb-2">Authorized Access</h2>
              <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Select your login method</p>
            </div>

            {/* Modern Tab Switcher */}
            <div className="flex p-1.5 bg-white/5 rounded-2xl mb-10 border border-white/5">
              <button 
                onClick={() => { setActiveTab('email'); setOtpSent(false); }}
                className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'email' ? 'bg-blue-600 text-white shadow-xl' : 'text-white/40'}`}
              >
                <Mail size={16} />
                <span>EMAIL AUTH</span>
              </button>
              <button 
                onClick={() => { setActiveTab('phone'); setOtpSent(false); }}
                className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'phone' ? 'bg-blue-600 text-white shadow-xl' : 'text-white/40'}`}
              >
                <Phone size={16} />
                <span>MOBILE OTP</span>
              </button>
            </div>

            <AnimatePresence mode='wait'>
              {activeTab === 'email' ? (
                <motion.form 
                  key="email-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleEmailSubmit} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-blue-500/50 outline-none transition-all font-bold text-white placeholder-white/10"
                        placeholder="yourname@domain.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Secure Password</label>
                      <Link to="/forgot-password" strokeWidth={3} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Forgot?</Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-blue-500/50 outline-none transition-all font-bold text-white placeholder-white/10"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 px-2">
                    <input 
                      type="checkbox" 
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded-lg border border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="rememberMe" className="text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer">
                      Keep me signed in
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-black rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center group"
                  >
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                      <>
                        <LogIn className="mr-3 group-hover:translate-x-1 transition-transform" size={20} />
                        <span>LOG IN SYSTEM</span>
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="phone-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Mobile Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="block w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:border-blue-500/50 outline-none transition-all font-bold text-white"
                            placeholder="9876543210"
                          />
                        </div>
                      </div>
                      
                      <div id="recaptcha-container" className="flex justify-center scale-90 origin-center"></div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-black rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center group"
                      >
                         {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                           <>
                              <RefreshCcw className="mr-3 group-hover:rotate-180 transition-transform duration-700" size={20} />
                              <span>SEND SECURITY CODE</span>
                           </>
                         )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Verify OTP</label>
                          <button
                            type="button" 
                            disabled={countdown > 0 || loading}
                            onClick={handleSendOTP}
                            className={`text-[10px] font-black uppercase tracking-widest ${countdown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-blue-400 hover:underline'}`}
                          >
                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength="6"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="block w-full py-5 rounded-2xl bg-white/5 border border-white/5 focus:border-blue-500/50 outline-none transition-all font-bold text-4xl tracking-[0.5em] text-white text-center"
                          placeholder="000000"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button 
                          type="button"
                          onClick={() => { setOtpSent(false); setOtp(''); }}
                          className="bg-white/5 p-5 rounded-2xl text-white/40 hover:text-white transition-all border border-white/5"
                        >
                          <ArrowRight className="rotate-180" size={24} />
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="flex-1 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-black rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center"
                        >
                           {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                             <>
                                <LogIn className="mr-3" size={20} />
                                <span>VERIFY ACCESS</span>
                             </>
                           )}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-center text-white/30 text-xs font-medium">
                New to the platform? <Link to="/register" className="text-white font-black hover:text-blue-400 transition-colors">Register as Student</Link>
              </p>
            </div>
          </motion.div>
          
          <div className="mt-8 flex justify-center items-center space-x-6 text-white/20">
             <div className="flex items-center space-x-2">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secured</span>
             </div>
             <div className="w-1 h-1 bg-white/20 rounded-full"></div>
             <div className="flex items-center space-x-2">
                <Activity size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">99.9% Uptime</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
