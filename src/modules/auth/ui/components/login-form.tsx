import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Input, 
  Button, 
  Link,
  Divider
} from '@heroui/react';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/modules/auth/ui/hooks/use-auth';

type LoginFormProps = {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
};

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSwitchToRegister,
  onSuccess 
}) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 items-center pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LogIn className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Sign In</h1>
        </div>
        <p className="text-small text-gray-600">
          Welcome back to InsightLead
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
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onValueChange={handleInputChange('email')}
            startContent={<Mail className="w-4 h-4 text-gray-400" />}
            isRequired
            variant="bordered"
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
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

          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            startContent={!isLoading ? <LogIn className="w-4 h-4" /> : null}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {onSwitchToRegister && (
          <>
            <Divider className="my-4" />
            <div className="text-center">
              <p className="text-small text-gray-600">
                Don't have an account?{' '}
                <Link
                  as="button"
                  color="primary"
                  size="sm"
                  onPress={onSwitchToRegister}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};