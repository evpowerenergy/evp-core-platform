
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdfa] via-[#e0f2fe] to-[#f1f5f9] relative overflow-hidden">
      {/* Glassmorphism background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-green-200/60 to-blue-300/40 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tr from-blue-200/40 to-green-100/60 rounded-full blur-2xl z-0" />
      <div className="w-full max-w-md z-10">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
