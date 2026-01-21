'use client';

import { useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Building2,
  MapPin,
  ArrowRight,
  Heart,
  Users,
  Zap,
  Shield,
  Coffee,
  Laptop,
  GraduationCap,
  Clock,
  ChevronRight,
} from "lucide-react";
import { motion, useInView, useMotionValue, useTransform, animate, useScroll } from "framer-motion";
import { useJobs, useIndustries, useTrackPageView } from "@/hooks";
import { useAuth } from "@/context";
import { WORK_TYPE_LABELS } from "@/shared/validators";
import { formatDistanceToNow } from "date-fns";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};


function LandingParallax({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ clipPath: "inset(0)" }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,63,70,0.5)_0%,rgba(24,24,27,1)_100%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:60px_60px]" />
        {/* Abstract shapes */}
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl filter animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl filter animate-pulse" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

function Counter({ value }: { value: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function ParallaxQuote() {
  return (
    <LandingParallax className="flex h-[60vh] items-center justify-center py-24 text-white">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Briefcase className="mx-auto mb-8 h-12 w-12 text-zinc-500" />
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl leading-tight">
            "The only way to do great work is to love what you do."
          </h2>
          <p className="mt-8 text-xl text-zinc-400">
            — Steve Jobs
          </p>
        </motion.div>
      </div>
    </LandingParallax>
  );
}



export function LandingHero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      {/* Faded corners overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(24,24,27,0.8)_70%,rgba(24,24,27,1)_100%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl lg:max-w-6xl text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            Find Your Next
            <motion.span
              className="block lg:inline-block mt-4 lg:mt-0 lg:ml-4 bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] animate-gradient-x"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ paddingBottom: '0.1em' }}
            >
              Career Opportunity
            </motion.span>
          </motion.h1>
          <motion.p
            className="mt-8 text-xl leading-relaxed text-zinc-300 max-w-xl mx-auto"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join a forward-thinking team where your talents are valued.
            Discover roles that challenge you and fuel your professional growth.
          </motion.p>
          <motion.div
            className="mt-10 flex items-center justify-center"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="inline-flex items-center gap-1 rounded-full bg-zinc-800/50 p-1.5 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Button asChild size="lg" className="gap-2 rounded-full">
                <Link href="/jobs">
                  Browse Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="ghost" size="lg" className="rounded-full text-white hover:bg-zinc-700/50">
                  <Link href="/login">
                    Log in
                  </Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingStats() {
  const { data: jobsData } = useJobs({ limit: 1000 });
  const { data: industriesData } = useIndustries();

  const jobs = jobsData?.jobs || [];
  const industries = industriesData || [];

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const uniqueLocations = new Set(jobs.map((job) => job.location));

    return [
      { icon: Briefcase, value: jobs.length.toString(), label: "Open Positions" },
      { icon: Building2, value: industries.length.toString(), label: "Industries" },
      { icon: MapPin, value: uniqueLocations.size.toString(), label: "Locations" },
    ];
  }, [jobs, industries]);

  return (
    <section className="border-b bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-8 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              variants={scaleIn}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <stat.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.p
                className="mt-4 text-3xl font-bold tracking-tight text-zinc-900"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                {/* Use 0 as fallback if value is not a valid number */}
                <Counter value={parseInt(stat.value) || 0} />
              </motion.p>
              <p className="text-sm text-zinc-600">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  const { user } = useAuth();

  return (
    <section className="bg-zinc-50 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl font-bold tracking-tight text-zinc-900"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            {user ? "Find your perfect role" : "Ready to take the next step?"}
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-zinc-600"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {user
              ? "Browse our open positions and apply for roles that match your skills and interests."
              : "Create an account to apply for positions and track your application status."
            }
          </motion.p>
          <motion.div
            className="mt-8"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild size="lg" className="rounded-full">
                <Link href={user ? "/jobs" : "/signup"}>
                  {user ? "Browse Jobs" : "Create Account"}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function FeaturedJobs() {
  const { data: jobsData, isLoading } = useJobs({ limit: 4 });
  const jobs = jobsData?.jobs || [];

  if (!isLoading && jobs.length === 0) return null;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            className="text-center mb-16 relative"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10" />
            <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-[10px] font-bold">
              Available Roles
            </Badge>
            <h2 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl mb-6">
              Career Opportunities
            </h2>
            <p className="mt-4 text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Find the perfect match for your expertise in our high-growth environment.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-full border-zinc-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="h-full">
                    <Card className="group relative h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 py-0 overflow-hidden">
                      <Link href={`/jobs/${job.jobNumber}`} className="absolute inset-0 z-0" aria-label={`View details for ${job.title}`} />
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <h3 className="text-xl font-bold text-zinc-900 group-hover:text-primary transition-colors pointer-events-auto w-fit">
                              {job.title}
                            </h3>
                            <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500">
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-zinc-400" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-zinc-400" />
                                {WORK_TYPE_LABELS[job.workType as keyof typeof WORK_TYPE_LABELS]}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-zinc-400" />
                                <span className="text-zinc-400">
                                  {formatDistanceToNow(new Date(job.publishedAt || job.createdAt), { addSuffix: true }).replace('about ', '')}
                                </span>
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="mt-6 pointer-events-auto relative z-10">
                          <Button asChild className="w-full rounded-full">
                            <Link href={`/jobs/${job.jobNumber}/apply`}>Apply Now</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            className="mt-10 text-center"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button asChild variant="outline" size="lg" className="rounded-full gap-2">
              <Link href="/jobs">
                View All Positions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const benefits = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health insurance, mental health support, and wellness programs.",
  },
  {
    icon: Coffee,
    title: "Work-Life Balance",
    description: "Flexible working hours, remote work options, and generous PTO.",
  },
  {
    icon: GraduationCap,
    title: "Learning & Growth",
    description: "Professional development budget, training programs, and mentorship.",
  },
  {
    icon: Laptop,
    title: "Modern Equipment",
    description: "Latest tools and technology to help you do your best work.",
  },
];

export function WhyJoinUs() {
  return (
    <LandingParallax className="py-24 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 border-white/20 text-white bg-white/5 backdrop-blur-sm px-4 py-1">Benefits</Badge>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Why Join Our Team?
            </h2>
            <p className="mt-4 text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              We believe in taking care of our people. Here&apos;s what you can expect when you join us.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={scaleIn}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-xl transition-all duration-300 bg-zinc-900/40 backdrop-blur-md border-white/10 group hover:border-primary/50">
                  <CardContent className="p-8">
                    <motion.div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 mb-6 group-hover:bg-primary transition-colors duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <benefit.icon className="h-7 w-7 text-blue-300 group-hover:text-white transition-colors duration-300" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                    <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </LandingParallax>
  );
}

const values = [
  {
    icon: Users,
    title: "Collaboration",
    description: "We work together, share knowledge, and support each other to achieve our goals.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We embrace new ideas, challenge the status quo, and continuously improve.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description: "We act with honesty, transparency, and accountability in everything we do.",
  },
  {
    icon: Clock,
    title: "Excellence",
    description: "We strive for quality and take pride in delivering exceptional results.",
  },
];


export function PopularIndustries() {
  const { data: industriesData } = useIndustries();
  const industries = industriesData || [];

  // Sort by job count (descending) and take top 4
  const topIndustries = [...industries]
    .sort((a, b) => (b._count?.jobs || 0) - (a._count?.jobs || 0))
    .slice(0, 4);

  if (topIndustries.length === 0) return null;

  return (
    <section className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">Explore by Sector</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Popular Industries
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              Find opportunities in the most thriving sectors.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
          >
            {topIndustries.map((industry, index) => (
              <motion.div
                key={industry.id}
                variants={scaleIn}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/jobs/industry/${encodeURIComponent(industry.name.toLowerCase().replace(/\s+/g, '-'))}`}>
                  <Card className="group h-full cursor-pointer overflow-hidden border-zinc-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-primary/50 rounded-bl-none rounded-tr-none">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-6 rounded-2xl bg-zinc-50 p-4 transition-colors group-hover:bg-primary/5">
                        <Building2 className="h-8 w-8 text-zinc-400 transition-colors group-hover:text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-zinc-900 group-hover:text-primary transition-colors">
                        {industry.name}
                      </h3>
                      <p className="text-sm font-medium text-zinc-500 group-hover:text-primary/80 transition-colors">
                        {industry._count?.jobs || 0} Open Positions
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button asChild variant="outline" size="lg" className="rounded-full gap-2">
              <Link href="/jobs">
                View All Industries
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function OurValues() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            className="text-center mb-12"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">Our Culture</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              What We Stand For
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              Our values guide everything we do and shape the way we work together.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="text-center"
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <value.icon className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="font-semibold text-zinc-900 mb-2">{value.title}</h3>
                <p className="text-sm text-zinc-600">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <motion.footer
      className="border-t bg-white py-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Careers Platform. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}

export function LandingPage() {
  // Track home page view
  useTrackPageView('HOME');

  return (
    <div>
      <LandingHero />
      <LandingStats />
      <FeaturedJobs />
      <ParallaxQuote />
      <PopularIndustries />
      <WhyJoinUs />
      <OurValues />
      <LandingCTA />
    </div>
  );
}
