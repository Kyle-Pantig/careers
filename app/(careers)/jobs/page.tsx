'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useJobs, useIndustries, useSaveJob, useUnsaveJob, useSavedJobs } from '@/hooks';
import { useAuth } from '@/context';
import { useMainJobFilters } from '@/stores';
import { MaxWidthLayout } from '@/components/careers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  MapPin,
  Briefcase,
  Clock,
  Search,
  Building2,
  ChevronRight,
  Filter,
  X,
  ChevronsUpDown,
  Check,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WORK_TYPE_LABELS,
  SHIFT_TYPE_LABELS,
} from '@/shared/validators';
import type { Job } from '@/lib/jobs';
import { toast } from 'sonner';

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

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Zustand store for filters (persisted in sessionStorage)
  const { 
    search, 
    workType: selectedWorkType, 
    location: selectedLocation,
    setSearch,
    setWorkType: setSelectedWorkType,
    setLocation: setSelectedLocation,
    clearFilters: clearStoreFilters,
  } = useMainJobFilters();
  
  // Local state for industry filter (not persisted) and popover
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [locationOpen, setLocationOpen] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  
  // Track screen size for responsive job count
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Number of jobs to display per industry based on screen size
  const jobsPerIndustry = isLargeScreen ? 6 : 4;

  // Fetch jobs and industries
  const { data: jobsData, isLoading: loadingJobs } = useJobs({ limit: 100 });
  const { data: industries = [], isLoading: loadingIndustries } = useIndustries();
  
  // Saved jobs
  const { data: savedJobs = [] } = useSavedJobs();
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();
  
  // Get saved job IDs for quick lookup
  const savedJobIds = useMemo(() => {
    return new Set(savedJobs.map((sj) => sj.job.id));
  }, [savedJobs]);
  
  const handleSaveJob = async (jobId: string, jobNumber: string) => {
    if (!user) {
      router.push(`/login?redirect=/jobs`);
      return;
    }
    
    setSavingJobId(jobId);
    try {
      if (savedJobIds.has(jobId)) {
        // Already saved, unsave it
        await unsaveJobMutation.mutateAsync(jobId);
      } else {
        // Save the job
        const result = await saveJobMutation.mutateAsync(jobId);
        if (result.requiresLogin) {
          router.push(`/login?redirect=/jobs`);
        } else {
        toast.success('Job saved successfully', {
          action: {
            label: 'View Saved Jobs',
            onClick: () => router.push('/my-applications?tab=saved'),
          },
          actionButtonStyle: {
            borderRadius: '9999px',
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          },
        });
        }
      }
    } finally {
      setSavingJobId(null);
    }
  };

  const jobs = jobsData?.jobs || [];

  // Extract unique locations from jobs
  const locations = useMemo(() => {
    const locationSet = new Set<string>();
    jobs.forEach((job) => {
      if (job.location) {
        locationSet.add(job.location);
      }
    });
    return Array.from(locationSet).sort();
  }, [jobs]);

  // Filter jobs - computed on every render to ensure fresh values
  const filteredJobs = jobs.filter((job) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.industry?.name.toLowerCase().includes(searchLower) ||
        job.jobNumber.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Industry filter
    if (selectedIndustry !== 'all' && job.industryId !== selectedIndustry) {
      return false;
    }

    // Work type filter
    if (selectedWorkType !== 'all' && job.workType !== selectedWorkType) {
      return false;
    }

    // Location filter
    if (selectedLocation && job.location !== selectedLocation) {
      return false;
    }

    return true;
  });

  // Group jobs by industry - computed on every render
  const jobsByIndustry = (() => {
    const grouped: Record<string, { industry: { id: string; name: string; slug?: string }; jobs: Job[] }> = {};

    filteredJobs.forEach((job) => {
      const industryId = job.industryId;
      const industryName = job.industry?.name || 'Other';
      const industrySlug = job.industry?.slug;

      if (!grouped[industryId]) {
        grouped[industryId] = {
          industry: { id: industryId, name: industryName, slug: industrySlug },
          jobs: [],
        };
      }
      grouped[industryId].jobs.push(job);
    });

    // Sort by industry name
    return Object.values(grouped).sort((a, b) =>
      a.industry.name.localeCompare(b.industry.name)
    );
  })();

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  };

  const isJobExpired = (expiresAt: string | Date | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const hasActiveFilters = selectedIndustry !== 'all' || selectedWorkType !== 'all' || selectedLocation !== '' || search;

  const clearFilters = () => {
    clearStoreFilters();
    setSelectedIndustry('all');
  };

  return (
    <>
      {/* Hero Section - Full Width */}
      <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <MaxWidthLayout className="py-16 md:py-24 relative">
          <motion.div 
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              Join Our <span className="text-primary">Team</span>
            </motion.h1>
            <motion.p 
              className="text-lg text-muted-foreground mb-8"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Explore open positions across our departments and take the next step in your career with us.
            </motion.p>
            <motion.div 
              className="flex items-center gap-3"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 px-5 py-3 bg-background/80 backdrop-blur-sm rounded-full border shadow-sm">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{jobs.length}</span>
                <span className="text-muted-foreground">Open Positions</span>
              </div>
            </motion.div>
          </motion.div>
        </MaxWidthLayout>
      </div>

      {/* Main Content */}
      <MaxWidthLayout className="py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, location, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            {/* Industry Filter */}
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Work Type Filter */}
          <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Work Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Types</SelectItem>
              {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location Filter - Combobox */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={locationOpen}
                className="w-full sm:w-[200px] justify-between font-normal"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {!selectedLocation ? (
                    <span className="text-muted-foreground">All Locations</span>
                  ) : (
                    <span className="truncate">{selectedLocation}</span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search location..." />
                <CommandList>
                  <CommandEmpty>No location found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all-locations"
                      onSelect={() => {
                        setSelectedLocation('');
                        setLocationOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !selectedLocation ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      All Locations
                    </CommandItem>
                    {locations.map((location) => (
                      <CommandItem
                        key={location}
                        value={location}
                        onSelect={() => {
                          setSelectedLocation(location);
                          setLocationOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedLocation === location ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {location}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filters:
            </span>
            {search && (
              <Badge variant="secondary" className="gap-1">
                Search: {search}
                <button onClick={() => setSearch('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedIndustry !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {industries.find((i) => i.id === selectedIndustry)?.name}
                <button onClick={() => setSelectedIndustry('all')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedWorkType !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {WORK_TYPE_LABELS[selectedWorkType as keyof typeof WORK_TYPE_LABELS]}
                <button onClick={() => setSelectedWorkType('all')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedLocation && (
              <Badge variant="secondary" className="gap-1">
                {selectedLocation}
                <button onClick={() => setSelectedLocation('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          {hasActiveFilters && ` (filtered from ${jobs.length})`}
        </p>
      </div>

      {/* Loading State */}
      {(loadingJobs || loadingIndustries) && (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loadingJobs && filteredJobs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms.'
                : 'There are no open positions at the moment. Check back later!'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jobs by Industry */}
      {!loadingJobs && jobsByIndustry.length > 0 && (
        <div className="space-y-10">
          {jobsByIndustry.map(({ industry, jobs: industryJobs }) => {
            const displayJobs = industryJobs.slice(0, jobsPerIndustry);
            const hasMore = industryJobs.length > jobsPerIndustry;
            
            return (
              <section key={industry.id}>
                {/* Industry Header */}
                <div className="flex items-center justify-between mb-4">
                  <Link 
                    href={`/jobs/industry/${encodeURIComponent(industry.name.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary transition-colors">{industry.name}</h2>
                  </Link>
                  {hasMore && (
                    <Button variant="ghost" size="sm" asChild className="gap-1">
                      <Link href={`/jobs/industry/${encodeURIComponent(industry.name.toLowerCase().replace(/\s+/g, '-'))}`}>
                        Browse All
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Job Cards - Show only 6 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {displayJobs.map((job) => (
                    <Card key={job.id} className="h-full hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {job.title}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {job.jobNumber}
                            </p>
                          </div>
                          <Button
                            variant={savedJobIds.has(job.id) ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 rounded-full"
                            onClick={() => handleSaveJob(job.id, job.jobNumber)}
                            disabled={savingJobId === job.id}
                          >
                            {savingJobId === job.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : savedJobIds.has(job.id) ? (
                              <BookmarkCheck className="h-4 w-4" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        {/* Location & Work Type */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Briefcase className="h-3 w-3" />
                            {WORK_TYPE_LABELS[job.workType]}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {SHIFT_TYPE_LABELS[job.shiftType]}
                          </Badge>
                        </div>

                        {/* Posted Date */}
                        {job.publishedAt && (
                          <p className="text-xs text-muted-foreground">
                            Posted {formatTimeAgo(job.publishedAt)}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" asChild className="rounded-full">
                            <Link href={`/jobs/${job.jobNumber}`}>
                              View Details
                            </Link>
                          </Button>
                          {isJobExpired(job.expiresAt) ? (
                            <Button size="sm" variant="destructive" className="flex-1 rounded-full" disabled>
                              Expired
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1 rounded-full" asChild>
                              <Link href={`/jobs/${job.jobNumber}/apply`}>
                                Apply
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Browse All Button - Bottom (for mobile) */}
                {hasMore && (
                  <div className="mt-4 text-center md:hidden">
                    <Button variant="outline" asChild className="rounded-full">
                      <Link href={`/jobs/industry/${encodeURIComponent(industry.name.toLowerCase().replace(/\s+/g, '-'))}`}>
                        View all {industryJobs.length} {industry.name} jobs
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
      </MaxWidthLayout>
    </>
  );
}
