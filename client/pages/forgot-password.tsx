import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { buildApiUrl } from '@/utils/formatters';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(buildApiUrl('/api/auth/forgot-password'), { email });
      toast.success('If an account exists, a reset link has been sent.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to request password reset';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password</h1>
          <p className="text-sm text-gray-600 mb-6">Enter your email to receive a password reset link.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

