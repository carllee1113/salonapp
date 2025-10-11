import ProfileForm from "@/components/profile-form";

export default function ProfilePage(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="text-sm text-muted-foreground">This is a stub view for Profile. Upcoming feature: account details and settings.</p>
      {/* Profile form UI */}
      <div className="mt-4">
        <ProfileForm />
      </div>
    </section>
  );
}