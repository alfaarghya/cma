'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { useUsername } from '../../hooks/useUsername';
import api from '../../libs/axios';
import { SignInFormData } from '@cma/types/clientTypes';
import { UserSignInSchema } from '@cma/types/serverTypes';


const SignInPage = () => {
  const router = useRouter();
  const { login } = useUsername();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(UserSignInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const res = await api.post('/auth/signin', data, { withCredentials: true });

      if (res.status === 200) {
        toast.success("Signed in successfully!");
        login(res.data.username, res.data.userId);
        router.push('/chat');
      }
    } catch (error: any) {
      console.error('Signin error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to sign in");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-8 shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block mb-1 font-medium">Username</label>
          <input type="text" {...register('username')} className="w-full border p-2 rounded" />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input type="password" {...register('password')} className="w-full border p-2 rounded" />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-blue-600 hover:underline">
          Create one here
        </a>
      </p>

    </div>
  );
};

export default SignInPage;
