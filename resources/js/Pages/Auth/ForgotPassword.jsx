import { useForm, Link } from '@inertiajs/react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('auth.password.email'));
    };

    return (
        <div style={{
            display   : 'flex',
            minHeight : '100vh',
            background: '#ffffff',
        }}>

            {/* ── LEFT — Image panel (50%) ── */}
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

            {/* ── RIGHT — Panel (50%) ── */}
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
                        style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
                    />
                </div>

                {/* ── CONTENT — vertically centered ── */}
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

                        {wasSuccessful ? (
                            <div style={{
                                display      : 'flex',
                                flexDirection: 'column',
                                alignItems   : 'center',
                                gap          : '16px',
                                textAlign    : 'center',
                            }}>
                                <CheckCircle size={44} style={{ color: 'var(--color-primary)' }} />
                                <div>
                                    <h2 style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontWeight: 'var(--font-weight-bold)',
                                        fontSize  : '26px',
                                        margin    : '0 0 8px',
                                    }}>
                                        <span style={{ color: 'var(--color-primary)' }}>Check</span>
                                        <span style={{ color: 'var(--color-text)' }}> your email.</span>
                                    </h2>
                                    <p style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize  : '14px',
                                        color     : 'var(--color-text-muted)',
                                        margin    : 0,
                                        lineHeight: '1.5',
                                    }}>
                                        If that address is in our system, a reset link is on its way.
                                    </p>
                                </div>
                                <Link
                                    href={route('login')}
                                    style={{
                                        display       : 'flex',
                                        alignItems    : 'center',
                                        gap           : '6px',
                                        fontFamily    : 'var(--font-body)',
                                        fontSize      : '13px',
                                        color         : 'var(--color-primary)',
                                        textDecoration: 'none',
                                        fontWeight    : '500',
                                    }}
                                >
                                    <ArrowLeft size={14} /> Back to sign in
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontWeight: 'var(--font-weight-bold)',
                                        fontSize  : '26px',
                                        lineHeight: 'var(--line-height-tight)',
                                        margin    : '0 0 6px',
                                    }}>
                                        <span style={{ color: 'var(--color-primary)' }}>Forgot your password?</span>
                                    </h2>
                                    <p style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize  : '13px',
                                        color     : 'var(--color-text-muted)',
                                        margin    : 0,
                                    }}>
                                        Enter your email and we'll send you a reset link.
                                    </p>
                                </div>

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

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={processing}
                                        style={{ width: '100%' }}
                                    >
                                        Send Reset Link
                                    </Button>
                                </form>

                                <Link
                                    href={route('login')}
                                    style={{
                                        display       : 'flex',
                                        alignItems    : 'center',
                                        justifyContent: 'center',
                                        gap           : '6px',
                                        fontFamily    : 'var(--font-body)',
                                        fontSize      : '13px',
                                        color         : 'var(--color-text-muted)',
                                        textDecoration: 'none',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                >
                                    <ArrowLeft size={14} /> Back to sign in
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* ── FOOTER ── */}
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
