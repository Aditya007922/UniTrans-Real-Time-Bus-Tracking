import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Loader2, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPassword({ darkMode }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSucceeded(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      let errorMsg = 'Failed to reset password.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      } else {
        errorMsg = `Error: ${err.message}`;
      }
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (succeeded) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-[3rem] p-12 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black dark:text-white mb-4">Check Your Email</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed">
            We've sent a password reset link to <br/>
            <span className="text-primary font-bold">{email}</span>
          </p>
          <button 
             onClick={() => setSucceeded(false)}
             className="text-gray-500 hover:text-primary font-bold flex items-center justify-center mx-auto transition-colors"
          >
             <ArrowLeft className="w-4 h-4 mr-2" /> Try different email
          </button>
          <Link to="/login" className="btn-primary w-full mt-8 h-[60px] text-lg">
            Return to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
      <div className={`max-w-md w-full glass rounded-[3rem] p-10 relative overflow-hidden transition-all duration-500`}>
        <div className="relative z-10 text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Reset Password
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-10 text-lg font-medium`}>
             No worries! Enter your email to recover your account secrets.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl mb-8 flex items-center shadow-sm"
              >
                <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm font-bold text-left">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            <div className="space-y-3">
              <label className="text-sm font-black uppercase tracking-wider ml-1 opacity-70 dark:text-gray-400">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-14 pr-4 py-4.5 rounded-2xl border-2 ${
                    darkMode 
                      ? 'bg-slate-800/50 border-slate-700 focus:border-primary text-white' 
                      : 'bg-gray-50 border-gray-100 focus:border-primary text-gray-900'
                  } outline-none transition-all duration-300 font-medium h-[60px]`}
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-[65px] group relative overflow-hidden text-xl"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <div className="flex items-center justify-center translate-y-[-1px]">
                  <Send className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  <span>Send Recovery Link</span>
                </div>
              )}
            </button>
          </form>
        </div>
        
        {/* Background blobs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}
