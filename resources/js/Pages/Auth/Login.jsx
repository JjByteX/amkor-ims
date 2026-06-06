import { useForm } from '@inertiajs/react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Alert from '../../Components/UI/Alert';

/**
 * Login page — no layout wrapper (public route).
 * Renders at /login.
 *
 * Card uses --radius-lg (16px) matching Card component.
 * Logo mark uses rounded-full (brand identity exception).
 */
export default function Login({ timedOut = false }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email   : '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('auth.login.submit'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-bg)]">
            {/* Card — uses --radius-lg matching the Card component */}
            <div
                className="w-full max-w-[400px] bg-[var(--color-card)] p-8 flex flex-col gap-6"
                style={{
                    borderRadius: 'var(--radius-lg)',
                    border: 'var(--border-container)',
                    boxShadow: [
                        '0 4px 6px -6px rgba(0,0,0,0.015)',
                        '0 3px 4px -4px rgba(0,0,0,0.012)',
                        '0 2px 2px -2px rgba(0,0,0,0.010)',
                        '0 1px 1px -1px rgba(0,0,0,0.008)',
                    ].join(','),
                }}
            >
                {/* Logo + company name */}
                <div className="flex flex-col items-center gap-3 text-center">
                    {/* Brand mark — intentionally full-circle (brand identity only) */}
                    <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <span className="text-white text-xl font-bold font-heading">AT</span>
                    </div>
                    <div>
                        <h1
                            className="font-heading font-semibold text-[var(--color-text)]"
                            style={{ fontSize: 'var(--font-size-heading)' }}
                        >
                            Amkor Travel & Tours
                        </h1>
                        <p className="font-body text-[13px] text-gray-400 mt-0.5">
                            Internal Management System
                        </p>
                    </div>
                </div>

                {/* Session timeout banner */}
                {timedOut && (
                    <Alert variant="warning" title="Session expired">
                        Your session timed out after inactivity. Please sign in again.
                    </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                    <Input
                        label="Email address"
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
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        placeholder="••••••••••"
                        icon={Lock}
                        required
                        autoComplete="current-password"
                    />

                    {errors.general && (
                        <Alert variant="error">{errors.general}</Alert>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        loading={processing}
                        className="w-full mt-1"
                    >
                        Sign In
                    </Button>
                </form>

                <p className="text-center font-body text-[11px] text-gray-300">
                    Contact your administrator if you cannot access your account.
                </p>
            </div>
        </div>
    );
}
