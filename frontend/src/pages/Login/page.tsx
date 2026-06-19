import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/api';

interface ApiError {
  message: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; speed: number; angle: number; color: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear any existing session when on login page
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', email);
      const response = await authService.login({ email, password });
      
      console.log('Login response:', response);
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('Login successful, redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Login error:', apiError);
      if (apiError.message?.toLowerCase().includes('invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(apiError.message || 'Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

      {/* Main Card Container */}
      <div 
        className="w-full max-w-md relative z-10 animate-float-in"
        style={{
          transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Logo/Brand Header - Glitch effect with animation */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_-10px_rgba(255,0,255,0.3)] mb-4 relative animate-float">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse-slow" />
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 rounded-2xl animate-spin-slow"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter relative glitch-wrapper">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x relative z-10">
              TaskFlow
            </span>
            <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
            {/* Glitch overlays */}
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent opacity-0 animate-glitch-1" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%)' }}>
              TaskFlow
            </span>
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent opacity-0 animate-glitch-2" style={{ clipPath: 'polygon(0 40%, 100% 40%, 100% 60%, 0 60%)' }}>
              TaskFlow
            </span>
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent opacity-0 animate-glitch-3" style={{ clipPath: 'polygon(0 80%, 100% 80%, 100% 100%, 0 100%)' }}>
              TaskFlow
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase animate-pulse-slow">
            ✦ Smart Task Management System ✦
          </p>
        </div>

        {/* Login Card - Glass morphism with rainbow border */}
        <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] transition-all duration-500 hover:shadow-[0_0_100px_-10px_rgba(255,0,255,0.3)] overflow-hidden group animate-slide-up">
          {/* Animated gradient border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
          
          {/* Card shine effect */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-gradient-x">Access Restricted</h2>
              <p className="text-white text-sm mt-1 tracking-wide animate-pulse-slow">Enter the void to continue</p>
            </div>

            {/* Error Message - Glitch style with animation */}
            {error && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl flex items-start gap-2 animate-shake backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm text-red-300 font-mono">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field - Cyber style */}
              <div className="space-y-2 animate-slide-up-delay-1">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 font-mono tracking-wider">
                  <Mail className="w-4 h-4 text-purple-400 animate-float" />
                  <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">Enter Email</span>
                </label>
                <div className="relative group/input">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                    placeholder="agent@gmail.com"
                    required
                    autoComplete="email"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover/input:border-purple-500/20 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Field - Cyber style */}
              <div className="space-y-2 animate-slide-up-delay-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 font-mono tracking-wider">
                  <Lock className="w-4 h-4 text-cyan-400 animate-float" style={{ animationDelay: '0.5s' }} />
                  <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Enter Password</span>
                </label>
                <div className="relative group/input">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 font-mono"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors duration-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-white mt-1 font-mono animate-pulse-slow">
                  {showPassword ? "[ VISIBLE ]" : "[ HIDDEN ]"}
                </p>
              </div>

              {/* Forgot Password Link - Cyber style */}
              {/* <div className="flex justify-end animate-slide-up-delay-3">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-400 hover:text-cyan-400 font-mono transition-all duration-300 hover:underline underline-offset-2 decoration-dotted hover:scale-105 transform inline-block"
                >
                  &lt; recover_access /&gt;
                </Link>
              </div> */}

              {/* Login Button - Neon style */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-3 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider relative overflow-hidden group/btn animate-slide-up-delay-4"
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
                    <LogIn className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                    <span>ACCESS GRANTED</span>
                  </>
                )}
              </button>

              {/* Divider - Cyber style */}
              <div className="relative my-6 animate-slide-up-delay-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-black/50 backdrop-blur-sm text-gray-400 font-mono text-xs tracking-widest animate-pulse-slow">∥ UNREGISTERED ∥</span>
                </div>
              </div>

              {/* Create Account Link - Cyber style */}
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 font-mono py-3 rounded-xl transition-all duration-300 group hover:border-purple-500/30 animate-slide-up-delay-6"
              >
                <span className="group-hover:text-purple-400 transition-colors">⟳ REQUEST ACCESS</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-purple-400 transition-all duration-300 group-hover:rotate-12" />
              </Link>
            </form>
          </div>
        </div>

        {/* Footer Note - Cyber style */}
        <p className="text-center text-xs text-white mt-8 font-mono tracking-widest animate-pulse-slow">
          [ TERMS_OF_SERVICE ] & [ PRIVACY_POLICY ] — BY SIGNING YOU AGREE
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