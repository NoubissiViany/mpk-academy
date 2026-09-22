import { Card, CardContent } from "@/components/ui/card";
import { UpdatePasswordForm } from "@/features/auth/password-forms";

export const metadata = { title: "Choose a new password" };

export default function UpdatePasswordPage() {
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">Account recovery</p>
          <h1 className="mt-3 text-3xl font-bold">Choose a new password.</h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            This form is available after opening your recovery email.
          </p>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
