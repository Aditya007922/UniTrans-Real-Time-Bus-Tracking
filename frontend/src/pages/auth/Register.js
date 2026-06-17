import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, UserPlus, Loader2, Phone, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Register({ darkMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('passenger');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 chars');
    
    try {
      setLoading(true);
      // We pass the phone number to record in Firestore
      await signup(email, password, name, role, phoneNumber);
      toast.success('System Registration Successful!');
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('Identity already exists. Try logging in.');
      } else {
        toast.error('Registration Security Exception.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
      <div className={`max-w-6xl w-full flex flex-col md:flex-row glass rounded-[3.5rem] overflow-hidden shadow-2xl shadow-primary/20 bg-white/50 dark:bg-slate-900/50`}>
        
        {/* Left Panel: Info */}
        <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white relative">
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Create <br /> Identity.
            </h1>
            <p className="text-xl text-blue-50/80 mb-12 font-medium max-w-sm">
              Register your credentials to gain authorized access to the transport intelligence network.
            </p>
            
            <div className="space-y-6">
               <div className="flex items-center space-x-4 bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Secure Directory</h3>
                    <p className="text-white/60 text-sm">Official student/staff record integration.</p>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-[100px] -mr-32 -mt-32"></div>
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10">
              <h2 className="text-4xl font-black mb-2 dark:text-white tracking-tight uppercase text-sm opacity-50">Portal Enrollment</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Already have an identity? <Link to="/login" className="text-primary hover:underline font-black">Sign in</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Legal Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`block w-full pl-16 pr-6 py-4 rounded-3xl border-2 ${
                        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'
                      } focus:border-primary outline-none transition-all h-[65px] dark:text-white font-bold`}
                      placeholder="Enter Full Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Email Address</label>
                     <div className="relative group">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors h-5 w-5" />
                       <input
                         type="email"
                         required
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className={`block w-full pl-16 pr-6 py-4 rounded-3xl border-2 ${
                           darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'
                         } focus:border-primary outline-none transition-all h-[65px] dark:text-white font-bold`}
                         placeholder="name@campus.edu"
                       />
                     </div>
                   </div>

                   <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Phone Contact</label>
                     <div className="relative group">
                       <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors h-5 w-5" />
                       <input
                         type="tel"
                         required
                         value={phoneNumber}
                         onChange={(e) => setPhoneNumber(e.target.value)}
                         className={`block w-full pl-16 pr-6 py-4 rounded-3xl border-2 ${
                           darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'
                         } focus:border-primary outline-none transition-all h-[65px] dark:text-white font-bold`}
                         placeholder="+91 98765..."
                       />
                     </div>
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Security Access Pin</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors h-5 w-5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-16 pr-6 py-4 rounded-3xl border-2 ${
                        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'
                      } focus:border-primary outline-none transition-all h-[65px] dark:text-white font-bold`}
                      placeholder="Min. 6 alphanumeric"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">System Permission Role</label>
                  <div className="flex gap-4">
                    {['passenger', 'driver', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black capitalize transition-all border-2 text-xs tracking-widest ${
                          role === r 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : `${darkMode ? 'bg-slate-800 border-slate-700 text-gray-500' : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'}`
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-[75px] text-xl font-black group mt-6"
              >
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                    <span>ENROLL IDENTITY</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
