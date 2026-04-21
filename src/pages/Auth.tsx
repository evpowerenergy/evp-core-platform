
import { useState } from 'react';
import { useAuthSession } from "@/hooks/useAuthSession";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import PasswordReset from "@/components/auth/PasswordReset";
import PasswordUpdate from "@/components/auth/PasswordUpdate";
import { PageLoading } from "@/components/ui/loading";

const Auth = () => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { loading, showPasswordUpdate } = useAuthSession();

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <AuthLayout>
      {showPasswordUpdate ? (
        <PasswordUpdate />
      ) : showPasswordReset ? (
        <PasswordReset onBackToLogin={() => setShowPasswordReset(false)} />
      ) : (
        <LoginForm onShowPasswordReset={() => setShowPasswordReset(true)} />
      )}
    </AuthLayout>
  );
};

export default Auth;
