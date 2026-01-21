'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Briefcase,
    Clock,
    Bookmark,
    BookmarkCheck,
    Loader2,
} from 'lucide-react';
import {
    WORK_TYPE_LABELS,
    JOB_TYPE_LABELS,
    SHIFT_TYPE_LABELS,
} from '@/shared/validators';
import type { Job } from '@/lib/jobs';

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

interface JobCardProps {
    job: Job;
    isSaved?: boolean;
    isSaving?: boolean;
    onToggleSave?: (id: string, jobNumber: string) => void;
    isAdminOrStaff?: boolean;
    hasActiveApp?: boolean;
    applicationId?: string;
}

export function JobCard({
    job,
    isSaved,
    isSaving,
    onToggleSave,
    isAdminOrStaff,
    hasActiveApp,
    applicationId,
}: JobCardProps) {
    return (
        <Card className="h-full hover:shadow-md transition-shadow">
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
                    {/* Save button - hidden for admin/staff */}
                    {!isAdminOrStaff && (
                        <Button
                            variant={isSaved ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 rounded-full"
                            onClick={() => onToggleSave?.(job.id, job.jobNumber)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isSaved ? (
                                <BookmarkCheck className="h-4 w-4" />
                            ) : (
                                <Bookmark className="h-4 w-4" />
                            )}
                        </Button>
                    )}
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
                        {formatTimeAgo(job.publishedAt)}
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
                        hasActiveApp ? (
                            <Button size="sm" variant="secondary" className="flex-1 rounded-full" asChild>
                                <Link href={`/my-applications/${applicationId}`}>
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
    );
}
