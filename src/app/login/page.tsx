
import { AuthForm } from '@/components/auth-form';

/**
 * The login page of the application.
 * It renders the authentication form, allowing users to sign in or create an account.
 * @returns {JSX.Element} The login page component.
 */
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6.5rem)] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
