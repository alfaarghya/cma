"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUsername } from "../../hooks/useUsername";
import { UserSignUpSchema } from "@cma/types/serverTypes";
import { SignUpFormData } from "@cma/types/clientTypes";
import api from "../../libs/axios";

const SignUpPage = () => {
  const router = useRouter();
  const { login } = useUsername();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(UserSignUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const res = await api.post("/auth/signup", data, { withCredentials: true });

      if (res.status === 200) {
        toast.success("Signed up successfully!");
        login(res.data.username, res.data.userId);
        router.push("/chat");
      }
    } catch (error: any) {
      console.error("Signup error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to sign up");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-8 shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center">Create an Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block mb-1 font-medium">Full Name</label>
          <input type="text" {...register("name")} className="w-full border p-2 rounded" />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Username</label>
          <input type="text" {...register("username")} className="w-full border p-2 rounded" />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input type="email" {...register("email")} className="w-full border p-2 rounded" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input type="password" {...register("password")} className="w-full border p-2 rounded" />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <a href="/signin" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
};

export default SignUpPage;
