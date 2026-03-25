import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getErrorMessage } from '@/lib/http';

// Configuración personalizada de SweetAlert para el tema de la aplicación
const Alert = Swal.mixin({
    background: '#0f0f0f',
    color: '#E8E8E8',
    confirmButtonColor: '#F5A623',
    customClass: {
        popup: 'rounded-[4px] border border-[#222]',
        title: 'text-h2 font-heading',
        confirmButton: 'rounded-[4px] px-6 py-2 text-[13px] font-sans font-medium uppercase tracking-wider text-black',
    }
});

export function LoginPage() {
    const { isAuthenticated, isLoading, login, loginWithGoogle, oauthError } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isOauthProcessing, setIsOauthProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Efecto para mostrar error de OAuth si existe
    useEffect(() => {
        if (oauthError) {
            Alert.fire({
                icon: 'error',
                title: 'Error de Autenticación',
                text: oauthError,
                iconColor: '#E74C3C',
            });
        }
    }, [oauthError]);

    // Si ya estamos autenticados, redirigir inmediatamente
    if (isAuthenticated) {
        const redirectTo = (location.state as { from?: string })?.from || searchParams.get('returnTo') || '/panel';
        console.log(`LoginPage: Usuario ya autenticado, redirigiendo a ${redirectTo}`);
        return <Navigate to={redirectTo} replace />;
    }

    if (isLoading || isOauthProcessing) {
        return (
            <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-small text-text-muted animate-pulse">
                    {isOauthProcessing ? 'Conectando con Google...' : 'Sincronizando sesión...'}
                </p>
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            console.error('Login error:', err);
            Alert.fire({
                icon: 'error',
                title: 'Error de Acceso',
                text: 'Email o contraseña incorrectos. Por favor, verifica tus credenciales.',
                iconColor: '#E74C3C',
            });
            setError('Credenciales inválidas. Verifica tu email y contraseña.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setIsOauthProcessing(true);
            await loginWithGoogle();
        } catch (error: unknown) {
            setIsOauthProcessing(false);
            setError(`Error al conectar con Google: ${getErrorMessage(error, 'Intenta de nuevo.')}`);
        }
    };

    return (
        <div className="min-h-screen bg-bg-base flex">
            {/* ── Left: Hero panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
                {/* Grid pattern background */}
                <div
                    className="absolute inset-0 opacity-[0.2]"
                    style={{
                        backgroundImage: `
              linear-gradient(#222 1px, transparent 1px),
              linear-gradient(90deg, #222 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                        mask: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
                        WebkitMask: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 max-w-md px-12 animate-enter">
                    {/* Isotipo grande */}
                    <div className="w-28 h-28 mb-8">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <defs>
                                <radialGradient id="dg-login" cx="38%" cy="28%" r="70%">
                                    <stop offset="0%" stopColor="#FFD580" />
                                    <stop offset="50%" stopColor="#F5A623" />
                                    <stop offset="100%" stopColor="#AA6A00" />
                                </radialGradient>
                                <radialGradient id="hbg-login" cx="50%" cy="38%" r="62%">
                                    <stop offset="0%" stopColor="#1e1100" />
                                    <stop offset="100%" stopColor="#060400" />
                                </radialGradient>
                            </defs>
                            <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" fill="url(#hbg-login)" />
                            <line x1="9" y1="44" x2="22" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <line x1="9" y1="58" x2="22" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <line x1="91" y1="44" x2="78" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <line x1="91" y1="58" x2="78" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2.2" fill="none" strokeLinejoin="miter" />
                            <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#dg-login)" />
                            <path d="M44 38 C42.5 44 42 50 43 56" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.28" />
                        </svg>
                    </div>

                    <h2 className="text-text-secondary text-[16px] font-sans font-normal tracking-wide mb-1">
                        easy
                    </h2>
                    <h1 className="text-amber-500 font-display text-[56px] leading-none tracking-[0.06em] mb-6">
                        DIESEL
                    </h1>

                    <p className="text-body text-text-secondary leading-relaxed mb-8">
                        Plataforma de gestión, control y trazabilidad de combustibles en estaciones de servicio colombianas.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {['Control', 'Trazabilidad', 'Normativa', 'Reportes'].map((tag) => (
                            <span
                                key={tag}
                                className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-[2px] bg-bg-surface text-text-muted border border-[#333]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right: Login form ── */}
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-sm animate-enter" style={{ animationDelay: '0.1s' }}>
                    {/* Back link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-text-muted hover:text-amber-500 uppercase tracking-wider interactive mb-8"
                    >
                        <Icon name="arrow-left" size={14} />
                        Volver al inicio
                    </Link>

                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <Icon name="tank" size={28} className="text-amber-500" />
                        <div className="flex flex-col">
                            <span className="text-text-secondary text-[13px] font-sans leading-none tracking-wide">easy</span>
                            <span className="text-amber-500 font-display text-[22px] leading-none tracking-[0.06em]">DIESEL</span>
                        </div>
                    </div>

                    <h2 className="text-h1 text-text-primary mb-2">Iniciar sesión</h2>
                    <p className="text-small text-text-secondary mb-8">
                        Ingresa tus credenciales para acceder al sistema
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="login-email" className="text-label text-text-secondary">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@correo.com"
                                required
                                className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-default rounded-[4px] text-text-primary text-[14px] font-sans placeholder:text-text-muted interactive focus:border-amber-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="login-password" className="text-label text-text-secondary">Contraseña</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3.5 py-2.5 pr-10 bg-bg-elevated border border-border-default rounded-[4px] text-text-primary text-[14px] font-sans placeholder:text-text-muted interactive focus:border-amber-500 focus:outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary interactive"
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    <Icon name="eye" size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {(error || oauthError) && (
                            <div className="px-3 py-2 bg-transparent border border-red-500 rounded-[4px]">
                                <p className="text-[12px] font-mono text-red-500">{error || oauthError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <Button type="submit" className="w-full" isLoading={submitting}>
                            Iniciar sesión
                        </Button>

                        <p className="text-center text-[12px] text-text-muted mt-4">
                            ¿No tienes una cuenta?{' '}
                            <Link to="/register" className="text-amber-500 hover:underline font-medium">
                                Regístrate aquí
                            </Link>
                        </p>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <span className="flex-1 h-px bg-border-subtle" />
                        <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">o</span>
                        <span className="flex-1 h-px bg-border-subtle" />
                    </div>

                    {/* Google */}
                    <Button variant="ghost" className="w-full" onClick={handleGoogleLogin}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continuar con Google
                    </Button>

                    {/* Footer */}
                    <p className="text-center mt-8 text-[10px] font-mono text-text-muted tracking-wider uppercase">
                        Universidad Piloto de Colombia · 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
