import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/password-forms";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">Account recovery</p>
          <h1 className="mt-3 text-3xl font-bold">Reset your password.</h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            We will email you a secure link to choose a new password.
          </p>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
