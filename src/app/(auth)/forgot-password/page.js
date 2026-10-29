import ForgotPassword from "@/components/forgot-password/ForgotPassword";

export default async function ForgotPasswordPage({ searchParams }) {
  const { email } = await searchParams;

  return <ForgotPassword initialEmail={email} />;
}
