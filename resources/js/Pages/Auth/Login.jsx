import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../Components/UI/Button';
import Input from '../../Components/UI/Input';
import Alert from '../../Components/UI/Alert';
import Card from '../../Components/UI/Card';
import AmkorLogo from '../../Components/UI/AmkorLogo';

export default function Login({ timedOut = false }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email   : '',
        password: '',
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
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-8 sm:px-6">
            <Card
                className="flex w-full max-w-[430px] flex-col"
                style={{ gap: 'var(--space-3)', padding: '32px' }}
            >
                {/* Logo + company name */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <div style={{ color: 'var(--color-primary)' }}>
                        <AmkorLogo size={56} />
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

                {timedOut && (
                    <Alert variant="warning" title="Session expired">
                        Your session timed out after inactivity. Please sign in again.
                    </Alert>
                )}

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
            </Card>
        </div>
    );
}
