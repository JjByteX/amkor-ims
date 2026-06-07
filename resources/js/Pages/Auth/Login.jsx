import { useForm } from '@inertiajs/react';
import { Mail, Lock } from 'lucide-react';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Alert from '../../Components/UI/Alert';
import Card from '../../Components/UI/Card';

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
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-8 sm:px-6">
            <Card
                className="flex w-full max-w-[430px] flex-col"
                style={{ gap: 'var(--space-3)', padding: '32px' }}
            >
                {/* Logo + company name */}
                <div className="flex flex-col items-center gap-3 text-center">
                    {/* Brand mark — intentionally full-circle (brand identity only) */}
                    <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <span className="text-white text-xl font-bold font-heading">AT</span>
                    </div>
                    <div>
                        <h1
                            className="font-heading font-bold text-[var(--color-text)]"
                            style={{ fontSize: 'var(--font-size-heading)', lineHeight: 'var(--line-height-tight)' }}
                        >
                            Amkor Travel & Tours
                        </h1>
                        <p className="font-body text-[13px] text-[var(--color-text-muted)] mt-1">
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

                <p className="text-center font-body text-[12px] text-[var(--color-text-muted)]">
                    Contact your administrator if you cannot access your account.
                </p>
            </Card>
        </div>
    );
}
