import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getErrorMessage } from '@/lib/http';

export function RegisterPage() {
    const { isAuthenticated, isLoading, registerWithEmail, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-base flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setSubmitting(true);

        try {
            await registerWithEmail(email, password, nombre);
            setSuccess(true);
        } catch (error: unknown) {
            setError(getErrorMessage(error, 'Error al registrar usuario. Intenta de nuevo.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            await loginWithGoogle();
        } catch (error: unknown) {
            setError(`Error al conectar con Google: ${getErrorMessage(error, 'Intenta de nuevo.')}`);
        }
    };

    return (
        <div className="min-h-screen bg-bg-base flex">
            {/* ── Left: Hero panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-border-subtle">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
              linear-gradient(var(--color-amber-500) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-amber-500) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                    }}
                />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.06) 0%, transparent 70%)' }} />

                <div className="relative z-10 max-w-md px-12 animate-enter">
                    <div className="w-20 h-20 mb-8">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2.2" fill="none" />
                            <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="#F5A623" fillOpacity="0.8" />
                        </svg>
                    </div>
                    <h2 className="text-text-secondary text-[14px] font-sans font-normal tracking-wide mb-1 uppercase">Únete a</h2>
                    <h1 className="text-amber-500 font-display text-[48px] leading-none tracking-[0.06em] mb-6">DIESEL</h1>
                    <p className="text-text-secondary text-[14px] leading-relaxed mb-8">
                        La plataforma definitiva para la gestión de combustibles en Colombia.
                    </p>
                    <div className="space-y-4">
                        {['Control de Inventarios', 'Reportes Normativos', 'Trazabilidad de Precios'].map((feat) => (
                            <div key={feat} className="flex items-center gap-3 text-text-muted text-[12px] font-mono uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                {feat}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right: Register form ── */}
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-sm animate-enter" style={{ animationDelay: '0.1s' }}>
                    <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-mono text-text-muted hover:text-amber-500 uppercase tracking-wider interactive mb-8">
                        <Icon name="arrow-left" size={14} />
                        Volver al inicio
                    </Link>

                    <h2 className="text-h1 text-text-primary mb-2">Crear cuenta</h2>
                    <p className="text-small text-text-secondary mb-8">
                        Regístrate para comenzar a gestionar tus operaciones
                    </p>

                    {success ? (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-brand p-6 text-center">
                            <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon name="mail" size={24} />
                            </div>
                            <h3 className="text-text-primary font-medium mb-2">¡Registro exitoso!</h3>
                            <p className="text-[13px] text-text-secondary mb-6">
                                Hemos enviado un correo de confirmación a <strong>{email}</strong>. Por favor verifica tu bandeja de entrada.
                            </p>
                            <Link to="/login">
                                <Button className="w-full">Ir al inicio de sesión</Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-label text-text-secondary">Nombre completo</label>
                                <div className="relative">
                                    <Icon name="user" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Juan Pérez"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[14px] font-sans placeholder:text-text-muted interactive"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-label text-text-secondary">Email</label>
                                <div className="relative">
                                    <Icon name="mail" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="usuario@correo.com"
                                        required
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[14px] font-sans placeholder:text-text-muted interactive"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-label text-text-secondary">Contraseña</label>
                                <div className="relative">
                                    <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[14px] font-sans placeholder:text-text-muted interactive"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="px-3 py-2 bg-red-dim border border-red-500/30 rounded-brand">
                                    <p className="text-[12px] font-mono text-red-500">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full" isLoading={submitting}>
                                Registrarse
                            </Button>

                            <div className="flex items-center gap-3 my-6">
                                <span className="flex-1 h-px bg-border-subtle" />
                                <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">o continúa con</span>
                                <span className="flex-1 h-px bg-border-subtle" />
                            </div>

                            <Button variant="ghost" type="button" className="w-full" onClick={handleGoogleLogin}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </Button>

                            <p className="text-center text-[12px] text-text-muted mt-8">
                                ¿Ya tienes una cuenta?{' '}
                                <Link to="/login" className="text-amber-500 hover:underline font-medium">
                                    Inicia sesión
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
