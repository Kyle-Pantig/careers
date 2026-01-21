import { LandingPage } from "@/components/careers/landing-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Home",
  description: "Join our team and build the future with us. Browse our open positions and find your dream job.",
};

export default function HomePage() {
  return <LandingPage />;
}
