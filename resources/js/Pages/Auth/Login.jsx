import { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Alert from '../../Components/UI/Alert';

export default function Login({ timedOut = false }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email      : '',
        password   : '',
        remember_me: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('auth.login.submit'), {
            onFinish: () => reset('password'),
        });
    };

    const PasswordToggle = (
        <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: 'var(--color-text-muted)', lineHeight: 1,
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
    );

    return (
        <div style={{
            display   : 'flex',
            minHeight : '100vh',
            background: '#ffffff',
        }}>

            {/* ── LEFT — Image panel, true 50% ── */}
            <div style={{
                flex   : '1 1 0%',
                padding: '20px',
                display: 'flex',
            }}>
                <div style={{
                    flex              : 1,
                    borderRadius      : '16px',
                    backgroundImage   : 'url(/login-bg.png)',
                    backgroundSize    : 'cover',
                    backgroundPosition: 'center',
                }} />
            </div>

            {/* ── RIGHT — Login panel, true 50% ── */}
            <div style={{
                flex         : '1 1 0%',
                display      : 'flex',
                flexDirection: 'column',
                background   : '#ffffff',
                padding      : '40px 64px',
                boxSizing    : 'border-box',
            }}>

                {/* ── LOGO — pinned to top center ── */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <img
                        src="/amkor-logo.png"
                        alt="Amkor Travel & Tours Inc."
                        style={{
                            height   : '44px',
                            width    : 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </div>

                {/* ── FORM — vertically centered in remaining space ── */}
                <div style={{
                    flex          : 1,
                    display       : 'flex',
                    flexDirection : 'column',
                    justifyContent: 'center',
                    alignItems    : 'center',
                }}>
                    <div style={{
                        width        : '100%',
                        maxWidth     : '340px',
                        display      : 'flex',
                        flexDirection: 'column',
                        gap          : '20px',
                    }}>

                        <h2 style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 'var(--font-weight-bold)',
                            fontSize  : '26px',
                            lineHeight: 'var(--line-height-tight)',
                            margin    : 0,
                            textAlign : 'center',
                        }}>
                            <span style={{ color: 'var(--color-primary)' }}>Welcome.</span>
                        </h2>

                        {timedOut && (
                            <Alert variant="warning" title="Session expired">
                                Your session timed out after inactivity. Please sign in again.
                            </Alert>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                        >
                            <Input
                                label="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                placeholder="you@amkor.ph"
                                icon={Mail}
                                required
                                autoComplete="email"
                                autoFocus
                            />
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                placeholder="••••••••••"
                                icon={Lock}
                                rightIcon={PasswordToggle}
                                required
                                autoComplete="current-password"
                            />

                            {/* Remember me + Forgot Password */}
                            <div style={{
                                display       : 'flex',
                                alignItems    : 'center',
                                justifyContent: 'space-between',
                            }}>
                                <label style={{
                                    display   : 'flex',
                                    alignItems: 'center',
                                    gap       : '8px',
                                    cursor    : 'pointer',
                                    userSelect: 'none',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={data.remember_me}
                                        onChange={(e) => setData('remember_me', e.target.checked)}
                                        style={{
                                            width      : '15px',
                                            height     : '15px',
                                            accentColor: 'var(--color-primary)',
                                            cursor     : 'pointer',
                                            flexShrink : 0,
                                        }}
                                    />
                                    <span style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize  : '13px',
                                        color     : 'var(--color-text-muted)',
                                    }}>
                                        Remember me
                                    </span>
                                </label>

                                <Link
                                    href={route('auth.password.request')}
                                    style={{
                                        fontFamily    : 'var(--font-body)',
                                        fontSize      : '13px',
                                        color         : 'var(--color-primary)',
                                        textDecoration: 'none',
                                        fontWeight    : '500',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            {errors.general && (
                                <Alert variant="error">{errors.general}</Alert>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                loading={processing}
                                style={{ width: '100%', marginTop: '2px' }}
                            >
                                Sign In
                            </Button>
                        </form>
                    </div>
                </div>

                {/* ── FOOTER — pinned to bottom ── */}
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize  : '12px',
                    color     : 'var(--color-text-muted)',
                    textAlign : 'center',
                    margin    : 0,
                }}>
                    © {new Date().getFullYear()} Amkor Travel &amp; Tours Inc.
                </p>
            </div>
        </div>
    );
}
