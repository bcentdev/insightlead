import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Input, 
  Button, 
  Link,
  Divider,
  Progress
} from '@heroui/react';
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '@/modules/auth/ui/hooks/use-auth';
import { passwordService } from '@/modules/auth/infrastructure/services/password.service';

type RegisterFormProps = {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSwitchToLogin,
  onSuccess 
}) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    errors: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Password is not strong enough');
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);

    // Check password strength when password changes
    if (field === 'password') {
      const strength = passwordService.validatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const getPasswordStrengthColor = (score: number): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'primary';
    if (score >= 2) return 'warning';
    return 'danger';
  };

  const getPasswordStrengthText = (score: number): string => {
    if (score >= 4) return 'Very Strong';
    if (score >= 3) return 'Strong';
    if (score >= 2) return 'Medium';
    if (score >= 1) return 'Weak';
    return 'Very Weak';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 items-center pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Sign Up</h1>
        </div>
        <p className="text-small text-gray-600">
          Create your InsightLead account
        </p>
      </CardHeader>
      
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <Input
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onValueChange={handleInputChange('name')}
            startContent={<User className="w-4 h-4 text-gray-400" />}
            isRequired
            variant="bordered"
          />

          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onValueChange={handleInputChange('email')}
            startContent={<Mail className="w-4 h-4 text-gray-400" />}
            isRequired
            variant="bordered"
          />

          <div className="space-y-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onValueChange={handleInputChange('password')}
              startContent={<Lock className="w-4 h-4 text-gray-400" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              }
              isRequired
              variant="bordered"
            />
            
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.score >= 3 ? 'text-green-600' : 
                    passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {getPasswordStrengthText(passwordStrength.score)}
                  </span>
                </div>
                <Progress 
                  value={(passwordStrength.score / 5) * 100} 
                  color={getPasswordStrengthColor(passwordStrength.score)}
                  size="sm"
                />
                {passwordStrength.errors.length > 0 && (
                  <ul className="text-xs text-gray-500 space-y-1">
                    {passwordStrength.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onValueChange={handleInputChange('confirmPassword')}
            startContent={<Lock className="w-4 h-4 text-gray-400" />}
            endContent={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            }
            isRequired
            variant="bordered"
            color={
              formData.confirmPassword && formData.password !== formData.confirmPassword 
                ? 'danger' 
                : 'default'
            }
            errorMessage={
              formData.confirmPassword && formData.password !== formData.confirmPassword 
                ? 'Passwords do not match' 
                : undefined
            }
          />

          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            startContent={!isLoading ? <UserPlus className="w-4 h-4" /> : null}
            isDisabled={passwordStrength.score < 3}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        {onSwitchToLogin && (
          <>
            <Divider className="my-4" />
            <div className="text-center">
              <p className="text-small text-gray-600">
                Already have an account?{' '}
                <Link
                  as="button"
                  color="primary"
                  size="sm"
                  onPress={onSwitchToLogin}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};