'use client';

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { motion } from "framer-motion";
import { useJobs, useIndustries } from "@/hooks";
import { useAuth } from "@/context";
import { WORK_TYPE_LABELS } from "@/shared/validators";

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

export function LandingHero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <motion.div 
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className="text-4xl font-bold tracking-tight sm:text-6xl"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            Find Your Next
            <motion.span 
              className="block text-primary"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Career Opportunity
            </motion.span>
          </motion.h1>
          <motion.p 
            className="mt-6 text-lg leading-8 text-zinc-300"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join our team and be part of something great. 
            Explore open positions and take the next step in your career.
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
                {stat.value}
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
  const { data: jobsData } = useJobs({ limit: 4 });
  const jobs = jobsData?.jobs || [];

  if (jobs.length === 0) return null;

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
            <Badge variant="secondary" className="mb-4">Latest Openings</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Featured Positions
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              Discover our most exciting opportunities and find the perfect role for you.
            </p>
          </motion.div>

          <motion.div 
            className="grid gap-4 md:grid-cols-2"
            variants={staggerContainer}
          >
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/jobs/${job.jobNumber}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-900 group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span>{WORK_TYPE_LABELS[job.workType as keyof typeof WORK_TYPE_LABELS]}</span>
                          </div>
                          <div className="mt-3">
                            <Badge variant="outline" className="text-xs">
                              {job.industry?.name}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

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
    <section className="bg-zinc-50 py-16">
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
            <Badge variant="secondary" className="mb-4">Benefits</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Why Join Our Team?
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
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
                <Card className="h-full text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <motion.div 
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h3 className="font-semibold text-zinc-900 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-zinc-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
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
  return (
    <div>
      <LandingHero />
      <LandingStats />
      <FeaturedJobs />
      <WhyJoinUs />
      <OurValues />
      <LandingCTA />
    </div>
  );
}
