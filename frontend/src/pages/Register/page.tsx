// src/pages/Register/page.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, ArrowRight, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { authService } from '../../services/api.ts';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; speed: number; angle: number; color: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Generate particles
  useEffect(() => {
    const newParticles = [];
    const colors = ['#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#22d3ee'];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setParticles(newParticles);
  }, []);

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      // Calculate password strength
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }

    // Check password match
    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      const match = name === 'confirmPassword' 
        ? value === formData.password 
        : formData.confirmPassword === value;
      setPasswordMatch(match);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (passwordStrength < 2) {
      setError('Please use a stronger password (at least 8 characters with uppercase, number, or special character)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting registration with:', {
        name: formData.name,
        email: formData.email,
        password: '********'
      });
      
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      console.log('Registration successful, response:', response);
      
      // Store token and user data
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Token stored successfully');
        
        // Use window.location for immediate redirect
        window.location.href = '/dashboard';
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      console.error('Registration error details:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return texts[passwordStrength] || 'Very Weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
    return colors[passwordStrength] || '#ef4444';
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center p-4">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute rounded-full animate-float-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size * 2}px`,
              height: `${particle.size * 2}px`,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 4}px ${particle.color}33`,
              animationDuration: `${10 / particle.speed}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      {/* Cyberpunk / Glitch background with parallax */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#ff00ff33,transparent_60%),radial-gradient(circle_at_70%_80%,#00ffff33,transparent_60%),radial-gradient(circle_at_50%_50%,#000000,#0a0a0a)] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) scale(1.05)`,
        }}
      ></div>
      
      {/* Animated grid lines with parallax */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px)`,
        }}
      ></div>

      {/* Floating glitch cubes with parallax */}
      <div 
        className="absolute top-20 left-10 w-32 h-32 border border-purple-500/20 rotate-45 animate-spin-slow hidden lg:block transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px) rotate(45deg)`,
        }}
      ></div>
      <div 
        className="absolute bottom-20 right-10 w-24 h-24 border border-cyan-500/20 rotate-12 animate-spin-slow-reverse hidden lg:block transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px) rotate(12deg)`,
        }}
      ></div>
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full animate-pulse-slow delay-700 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(calc(-50% + ${mousePosition.x * 20}px), calc(-50% + ${mousePosition.y * 20}px))`,
        }}
      ></div>

      {/* Animated scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan-line"></div>
      </div>

      <div 
        className="w-full max-w-md relative z-10 animate-float-in"
        style={{
          transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_-10px_rgba(255,0,255,0.3)] mb-4 relative animate-float">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse-slow" />
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 rounded-2xl animate-spin-slow"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter relative glitch-wrapper">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x relative z-10">
              Join TaskFlow
            </span>
            <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
            {/* Glitch overlays */}
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent opacity-0 animate-glitch-1" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%)' }}>
              Join TaskFlow
            </span>
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent opacity-0 animate-glitch-2" style={{ clipPath: 'polygon(0 40%, 100% 40%, 100% 60%, 0 60%)' }}>
              Join TaskFlow
            </span>
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent opacity-0 animate-glitch-3" style={{ clipPath: 'polygon(0 80%, 100% 80%, 100% 100%, 0 100%)' }}>
              Join TaskFlow
            </span>
          </h1>
          <p className="text-white mt-2 text-sm tracking-widest uppercase animate-pulse-slow">
            ✦ Start managing tasks smarter ✦
          </p>
        </div>

        {/* Registration Card */}
        <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] transition-all duration-500 hover:shadow-[0_0_100px_-10px_rgba(255,0,255,0.3)] overflow-hidden group animate-slide-up">
          {/* Animated gradient border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
          
          {/* Card shine effect */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-gradient-x">Initialize Profile</h2>
              <p className="text-white text-sm mt-1 tracking-wide animate-pulse-slow">Enter the matrix to begin</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl flex items-start gap-2 animate-shake backdrop-blur-sm">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm text-red-300 font-mono">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div className="space-y-2 animate-slide-up-delay-1">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 font-mono tracking-wider">
                  <User className="w-4 h-4 text-purple-400 animate-float" />
                  <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Enter Name</span>
                </label>
                <div className="relative group/input">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                    placeholder="agent.codename"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2 animate-slide-up-delay-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 font-mono tracking-wider">
                  <Mail className="w-4 h-4 text-pink-400 animate-float" style={{ animationDelay: '0.5s' }} />
                  <span className="bg-gradient-to-r from-pink-300 to-cyan-300 bg-clip-text text-transparent">Enter Email</span>
                </label>
                <div className="relative group/input">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all duration-300 font-mono"
                    placeholder="agent@taskflow.void"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-cyan-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-slide-up-delay-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 font-mono tracking-wider">
                  <Lock className="w-4 h-4 text-cyan-400 animate-float" style={{ animationDelay: '1s' }} />
                  <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Enter Password</span>
                </label>
                <div className="relative group/input">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 font-mono"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-gray-700'
                          }`}
                          style={{
                            boxShadow: i < passwordStrength ? `0 0 10px ${getPasswordStrengthColor()}44` : 'none'
                          }}
                        ></div>
                      ))}
                    </div>
                    <p className={`text-xs font-mono ${passwordStrength >= 3 ? 'text-green-400' : 'text-gray-400'}`}>
                      STRENGTH: {getPasswordStrengthText().toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      [ MIN: 8 CHARS + UPPERCASE + NUMBER + SPECIAL ]
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2 animate-slide-up-delay-4">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 font-mono tracking-wider">
                  <KeyRound className="w-4 h-4 text-emerald-400 animate-float" style={{ animationDelay: '1.5s' }} />
                  <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Verify Password</span>
                </label>
                <div className="relative group/input">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 font-mono"
                    placeholder="••••••••"
                    required
                  />
                  {formData.confirmPassword && passwordMatch !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordMatch ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
                {passwordMatch === false && (
                  <p className="text-xs text-red-400 font-mono mt-1 animate-shake">[ MISMATCH ]</p>
                )}
                {passwordMatch === true && formData.confirmPassword && (
                  <p className="text-xs text-emerald-400 font-mono mt-1">[ VERIFIED ✓ ]</p>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading || (formData.confirmPassword !== '' && passwordMatch === false) || passwordStrength < 2}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-3 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider relative overflow-hidden group/btn animate-slide-up-delay-5"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/5 to-purple-600/0 animate-pulse-slow"></span>
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>INITIALIZING...</span>
                  </>
                ) : (
                  <>
                    <span>DEPLOY AGENT</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-5 animate-slide-up-delay-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-black/50 backdrop-blur-sm text-gray-400 font-mono text-xs tracking-widest animate-pulse-slow">∥ EXISTING AGENT ∥</span>
                </div>
              </div>

              {/* Login Link */}
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 font-mono py-3 rounded-xl transition-all duration-300 group hover:border-purple-500/30 animate-slide-up-delay-7"
              >
                <span className="group-hover:text-purple-400 transition-colors">⟳ RETURN TO ACCESS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-purple-400 transition-all duration-300" />
              </Link>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white mt-8 font-mono tracking-widest animate-pulse-slow">
          [ TERMS_OF_SERVICE ] & [ PRIVACY_POLICY ] — BY REGISTERING YOU AGREE
        </p>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes float-in {
          0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%) rotate(45deg); }
          to { transform: translateX(100%) rotate(45deg); }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          25% { transform: translateY(-20px) translateX(10px) scale(1.2); }
          50% { transform: translateY(10px) translateX(-10px) scale(0.8); }
          75% { transform: translateY(-10px) translateX(20px) scale(1.1); }
        }
        
        @keyframes glitch-1 {
          0%, 90%, 100% { opacity: 0; transform: translateX(0); }
          92% { opacity: 1; transform: translateX(-2px); }
          94% { opacity: 0; transform: translateX(2px); }
          96% { opacity: 1; transform: translateX(-1px); }
          98% { opacity: 0; transform: translateX(1px); }
        }
        
        @keyframes glitch-2 {
          0%, 85%, 100% { opacity: 0; transform: translateX(0); }
          87% { opacity: 1; transform: translateX(3px); }
          89% { opacity: 0; transform: translateX(-3px); }
          91% { opacity: 1; transform: translateX(2px); }
          93% { opacity: 0; transform: translateX(-2px); }
        }
        
        @keyframes glitch-3 {
          0%, 80%, 100% { opacity: 0; transform: translateX(0); }
          82% { opacity: 1; transform: translateX(-3px); }
          84% { opacity: 0; transform: translateX(3px); }
          86% { opacity: 1; transform: translateX(-2px); }
          88% { opacity: 0; transform: translateX(2px); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-float-in {
          animation: float-in 1s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        
        .animate-slide-up-delay-1 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.1s forwards;
        }
        
        .animate-slide-up-delay-2 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.2s forwards;
        }
        
        .animate-slide-up-delay-3 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.3s forwards;
        }
        
        .animate-slide-up-delay-4 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.4s forwards;
        }
        
        .animate-slide-up-delay-5 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.5s forwards;
        }
        
        .animate-slide-up-delay-6 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.6s forwards;
        }
        
        .animate-slide-up-delay-7 {
          opacity: 0;
          animation: slide-up 0.8s ease-out 0.7s forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
        
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
        
        .animate-scan-line {
          animation: scan-line 8s linear infinite;
        }
        
        .animate-float-particle {
          animation: float-particle 8s ease-in-out infinite;
        }
        
        .animate-glitch-1 {
          animation: glitch-1 4s infinite;
        }
        
        .animate-glitch-2 {
          animation: glitch-2 4s infinite 1s;
        }
        
        .animate-glitch-3 {
          animation: glitch-3 4s infinite 2s;
        }
        
        .delay-700 {
          animation-delay: 700ms;
        }
        
        .glitch-wrapper {
          position: relative;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 2px;
        }
        
        /* Input autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0.5) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};