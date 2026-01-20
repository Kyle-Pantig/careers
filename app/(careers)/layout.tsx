import { CareersHeader, CareersFooter } from "@/components/careers";
import { CookieConsent } from "@/components/shared/cookie-consent";

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <CareersHeader />
      <main className="flex-1">{children}</main>
      <CareersFooter />
      <CookieConsent />
    </div>
  );
}
