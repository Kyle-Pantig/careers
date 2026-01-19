'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useJobs, useIndustries, useSaveJob, useUnsaveJob, useSavedJobs, useUserApplications } from '@/hooks';
import { useAuth } from '@/context';
import { useIndustryJobFilters } from '@/stores';
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
  ArrowLeft,
  Filter,
  X,
  ChevronsUpDown,
  Check,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  WORK_TYPE_LABELS,
  JOB_TYPE_LABELS,
  SHIFT_TYPE_LABELS,
} from '@/shared/validators';

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

export default function IndustryJobsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  // Admin/staff cannot save or apply for jobs
  const isAdminOrStaff = user?.roles.includes('admin') || user?.roles.includes('staff');

  // Zustand store for industry page filters (persisted)
  const {
    search,
    workType: selectedWorkType,
    location: selectedLocation,
    setSearch,
    setWorkType: setSelectedWorkType,
    setLocation: setSelectedLocation,
    clearFilters: clearStoreFilters,
  } = useIndustryJobFilters();
  
  const [locationOpen, setLocationOpen] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  
  // Track screen size for responsive skeleton count
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch jobs and industries
  const { data: jobsData, isLoading: loadingJobs } = useJobs({ limit: 100 });
  const { data: industries = [], isLoading: loadingIndustries } = useIndustries();
  
  // Saved jobs
  const { data: savedJobs = [] } = useSavedJobs();
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();
  
  // User applications - to check if already applied
  const { data: applicationsData } = useUserApplications(user?.id);
  
  // Get applied job IDs for quick lookup (jobId -> applicationId)
  const appliedJobIds = useMemo(() => {
    if (!applicationsData?.applications) return new Map<string, string>();
    return new Map(
      applicationsData.applications.map((app) => [app.jobId, app.id])
    );
  }, [applicationsData]);
  
  // Get saved job IDs for quick lookup
  const savedJobIds = useMemo(() => {
    return new Set(savedJobs.map((sj) => sj.job.id));
  }, [savedJobs]);
  
  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      router.push(`/login?redirect=/jobs/industry/${slug}`);
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
          router.push(`/login?redirect=/jobs/industry/${slug}`);
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

  // Find industry by slug (convert slug back to name for comparison)
  const industry = useMemo(() => {
    return industries.find((i) => 
      i.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    );
  }, [industries, slug]);

  // Get all jobs for this industry
  const allIndustryJobs = useMemo(() => {
    if (!industry) return [];
    return jobs.filter((job) => job.industryId === industry.id);
  }, [jobs, industry]);

  // Extract unique locations from industry jobs
  const locations = useMemo(() => {
    const locationSet = new Set<string>();
    allIndustryJobs.forEach((job) => {
      if (job.location) {
        locationSet.add(job.location);
      }
    });
    return Array.from(locationSet).sort();
  }, [allIndustryJobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return allIndustryJobs.filter((job) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower) ||
          job.jobNumber.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Work type filter
      if (selectedWorkType !== 'all' && job.workType !== selectedWorkType) {
        return false;
      }

      // Location filter
      if (selectedLocation && selectedLocation !== '' && job.location !== selectedLocation) {
        return false;
      }

      return true;
    });
  }, [allIndustryJobs, search, selectedWorkType, selectedLocation]);

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

  const hasActiveFilters = selectedWorkType !== 'all' || selectedLocation !== '' || search;

  const clearFilters = () => {
    clearStoreFilters();
  };

  const isLoading = loadingJobs || loadingIndustries;

  return (
    <MaxWidthLayout className="py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
            Back to All Jobs
          </Link>
        </Button>
      </div>

      {/* Header */}
      {isLoading ? (
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      ) : (
        <motion.div 
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex items-center gap-4 mb-2"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {industry?.name || 'Industry'}
            </h1>
          </motion.div>
        </motion.div>
      )}

      {/* Search and Filters */}
      {!isLoading && allIndustryJobs.length > 0 && (
        <div className="mb-8 space-y-4">
          {/* Search - Full Width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Work Type Filter */}
            <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
                  className="w-full sm:w-[220px] justify-between font-normal bg-transparent"
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

          {/* Results Count */}
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
              {hasActiveFilters && ` (filtered from ${allIndustryJobs.length})`}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: isLargeScreen ? 6 : 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {/* No Jobs */}
      {!isLoading && filteredJobs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms.'
                : 'There are no open positions in this industry at the moment.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/jobs">Browse all jobs</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Cards */}
      {!isLoading && filteredJobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
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
                    onClick={() => handleSaveJob(job.id)}
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
                  <Badge variant="outline" className="text-xs">
                    {JOB_TYPE_LABELS[job.jobType]}
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
                  <Button variant="outline" size="sm" asChild className="flex-1 rounded-full">
                    <Link href={`/jobs/${job.jobNumber}`}>
                      View Details
                    </Link>
                  </Button>
                  {/* Expired shown for all, Apply/View Application hidden for admin/staff */}
                  {isJobExpired(job.expiresAt) ? (
                    <Button size="sm" variant="destructive" className="flex-1 rounded-full" disabled>
                      Expired
                    </Button>
                  ) : !isAdminOrStaff && (
                    appliedJobIds.has(job.id) ? (
                      <Button size="sm" variant="secondary" className="flex-1 rounded-full" asChild>
                        <Link href={`/my-applications/${appliedJobIds.get(job.id)}`}>
                          View Application
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1 rounded-full" asChild>
                        <Link href={`/jobs/${job.jobNumber}/apply`}>
                          Apply
                        </Link>
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MaxWidthLayout>
  );
}
