'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Switch } from '@/components/ui/switch';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Briefcase, MapPin, Building2, Calendar, Check, ChevronsUpDown, Clock, Award, DollarSign, Plus, Trash2, ListFilter } from 'lucide-react';
import { toast } from 'sonner';
import { type Job } from '@/lib/jobs';
import { useIndustries, useCreateJob, useUpdateJob } from '@/hooks';
import { jobSchema, type JobFormData, type CustomApplicationField, type CustomFieldType, WORK_TYPE_LABELS, JOB_TYPE_LABELS, SHIFT_TYPE_LABELS, CURRENCY_LABELS, CURRENCY_SYMBOLS, SALARY_PERIOD_LABELS, CUSTOM_FIELD_TYPE_LABELS } from '@/shared/validators';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface JobFormProps {
  job?: Job;
  mode: 'create' | 'edit';
}

export function JobForm({ job, mode }: JobFormProps) {
  const router = useRouter();
  const [industryOpen, setIndustryOpen] = useState(false);
  
  // React Query hooks
  const { data: industries = [], isLoading: loadingIndustries } = useIndustries();
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      industryId: job?.industryId || '',
      location: job?.location || '',
      workType: job?.workType || 'ONSITE',
      jobType: job?.jobType || 'FULL_TIME',
      shiftType: job?.shiftType || 'DAY',
      experienceMin: job?.experienceMin ?? 0,
      experienceMax: job?.experienceMax ?? null,
      salaryMin: job?.salaryMin ?? null,
      salaryMax: job?.salaryMax ?? null,
      salaryCurrency: job?.salaryCurrency || 'USD',
      salaryPeriod: job?.salaryPeriod || 'YEARLY',
      isPublished: job?.isPublished ?? false,
      expiresAt: job?.expiresAt || '',
      customApplicationFields: (job?.customApplicationFields as CustomApplicationField[] | null | undefined) ?? [],
    } as JobFormData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customApplicationFields',
  });

  const watchWorkType = watch('workType');
  const watchJobType = watch('jobType');
  const watchShiftType = watch('shiftType');
  const watchIndustryId = watch('industryId');
  const watchIsPublished = watch('isPublished');
  const watchExperienceMin = watch('experienceMin');
  const watchExperienceMax = watch('experienceMax');
  const watchSalaryMin = watch('salaryMin');
  const watchSalaryMax = watch('salaryMax');
  const watchSalaryCurrency = watch('salaryCurrency');
  const watchSalaryPeriod = watch('salaryPeriod');

  // Get selected industry name for display
  const selectedIndustry = industries.find((i) => i.id === watchIndustryId);

  const onSubmit = async (data: Record<string, unknown>) => {
    const formData = data as JobFormData;

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          ...formData,
          expiresAt: formData.expiresAt || undefined,
          customApplicationFields: formData.customApplicationFields ?? [],
        });
        toast.success('Job created successfully!');
      } else if (job) {
        await updateMutation.mutateAsync({
          id: job.id,
          data: {
            ...formData,
            expiresAt: formData.expiresAt || undefined,
            customApplicationFields: formData.customApplicationFields ?? [],
          },
        });
        toast.success('Job updated successfully!');
      }
      router.push('/dashboard/jobs');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'create' ? 'Create New Job' : 'Edit Job'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? 'Fill in the details below to create a new job posting.'
              : 'Update the job posting details below.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Essential details about the job position
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Software Engineer"
                    {...register('title')}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-destructive text-sm">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <RichTextEditor
                    value={watch('description')}
                    onChange={(value) => setValue('description', value)}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    disabled={isLoading}
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location & Work Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Work Type
                </CardTitle>
                <CardDescription>
                  Where and how the job will be performed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, NY"
                      {...register('location')}
                      disabled={isLoading}
                    />
                    {errors.location && (
                      <p className="text-destructive text-sm">{errors.location.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Work Type *</Label>
                    <Select
                      value={watchWorkType}
                      onValueChange={(value) => setValue('workType', value as JobFormData['workType'])}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.workType && (
                      <p className="text-destructive text-sm">{errors.workType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Job Type *</Label>
                    <Select
                      value={watchJobType}
                      onValueChange={(value) => setValue('jobType', value as JobFormData['jobType'])}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.jobType && (
                      <p className="text-destructive text-sm">{errors.jobType.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shift & Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Shift & Experience
                </CardTitle>
                <CardDescription>
                  Schedule and experience requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Shift Type *</Label>
                  <Select
                    value={watchShiftType}
                    onValueChange={(value) => setValue('shiftType', value as JobFormData['shiftType'])}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SHIFT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shiftType && (
                    <p className="text-destructive text-sm">{errors.shiftType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Years of Experience
                  </Label>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="experienceMin" className="text-xs text-muted-foreground">Minimum</Label>
                      <Input
                        id="experienceMin"
                        type="number"
                        min={0}
                        max={50}
                        placeholder="0"
                        value={watchExperienceMin ?? 0}
                        onChange={(e) => setValue('experienceMin', parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="experienceMax" className="text-xs text-muted-foreground">Maximum (optional)</Label>
                      <Input
                        id="experienceMax"
                        type="number"
                        min={0}
                        max={50}
                        placeholder="No max"
                        value={watchExperienceMax ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue('experienceMax', val ? parseInt(val) : null);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {watchExperienceMax 
                      ? `${watchExperienceMin}-${watchExperienceMax} years experience`
                      : watchExperienceMin > 0 
                        ? `${watchExperienceMin}+ years experience`
                        : 'Entry level / No experience required'}
                  </p>
                  {errors.experienceMin && (
                    <p className="text-destructive text-sm">{errors.experienceMin.message}</p>
                  )}
                  {errors.experienceMax && (
                    <p className="text-destructive text-sm">{errors.experienceMax.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Application Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListFilter className="h-5 w-5" />
                  Custom Application Fields
                </CardTitle>
                <CardDescription>
                  Extra questions on the apply form (e.g. Cover letter, Expected salary, Yes/No). Primary fields (name, email, contact, address, resume) are always required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, i) => (
                  <div
                    key={field.id}
                    className="rounded-lg border p-4 space-y-3 bg-muted/20"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Field {i + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(i)}
                        disabled={isLoading}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Key (e.g. cover_letter)</Label>
                        <Input
                          {...register(`customApplicationFields.${i}.key`)}
                          placeholder="cover_letter"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label (e.g. Cover Letter)</Label>
                        <Input
                          {...register(`customApplicationFields.${i}.label`)}
                          placeholder="Cover Letter"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={watch(`customApplicationFields.${i}.type`)}
                          onValueChange={(val: CustomFieldType) => {
                            setValue(`customApplicationFields.${i}.type`, val);
                            if (val === 'select') {
                              const opts = watch(`customApplicationFields.${i}.options`) as string[] | undefined;
                              if (!opts || opts.length === 0) {
                                setValue(`customApplicationFields.${i}.options`, ['Yes', 'No']);
                              }
                            }
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(CUSTOM_FIELD_TYPE_LABELS) as [CustomFieldType, string][]).map(([v, l]) => (
                              <SelectItem key={v} value={v}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!watch(`customApplicationFields.${i}.required`)}
                            onChange={(e) => setValue(`customApplicationFields.${i}.required`, e.target.checked)}
                            disabled={isLoading}
                            className="rounded border-input"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>
                    </div>
                    {watch(`customApplicationFields.${i}.type`) === 'select' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Options (comma‑separated, e.g. Yes, No)</Label>
                        <Input
                          placeholder="Yes, No"
                          value={(watch(`customApplicationFields.${i}.options`) as string[] | undefined)?.join(', ') ?? ''}
                          onChange={(e) => {
                            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setValue(`customApplicationFields.${i}.options`, arr);
                          }}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: `field_${fields.length + 1}`, label: '', type: 'text', required: false })}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add custom field
                </Button>
                {errors.customApplicationFields && (
                  <p className="text-destructive text-sm">{errors.customApplicationFields.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Industry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Industry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={industryOpen}
                        className="w-full justify-between font-normal"
                        disabled={isLoading || loadingIndustries}
                      >
                        {loadingIndustries ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : selectedIndustry ? (
                          selectedIndustry.name
                        ) : (
                          <span className="text-muted-foreground">Select industry...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search industry..." />
                        <CommandList>
                          <CommandEmpty>
                            {industries.length === 0 ? (
                              <div className="py-6 text-center text-sm">
                                No industries available.{' '}
                                <Link 
                                  href="/dashboard/industries" 
                                  className="text-primary underline"
                                  onClick={() => setIndustryOpen(false)}
                                >
                                  Add one
                                </Link>
                              </div>
                            ) : (
                              'No industry found.'
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {industries.map((industry) => (
                              <CommandItem
                                key={industry.id}
                                value={industry.name}
                                onSelect={() => {
                                  setValue('industryId', industry.id);
                                  setIndustryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    watchIndustryId === industry.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {industry.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.industryId && (
                    <p className="text-destructive text-sm">{errors.industryId.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Compensation
                </CardTitle>
                <CardDescription>
                  Salary range for this position (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label>Currency</Label>
                    <Select
                      value={watchSalaryCurrency}
                      onValueChange={(value) => setValue('salaryCurrency', value as JobFormData['salaryCurrency'])}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full [&>span]:truncate [&>span]:block">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CURRENCY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>Period</Label>
                    <Select
                      value={watchSalaryPeriod}
                      onValueChange={(value) => setValue('salaryPeriod', value as JobFormData['salaryPeriod'])}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full [&>span]:truncate [&>span]:block">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOURLY">Hourly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="salaryMin" className="text-xs text-muted-foreground">Minimum</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {CURRENCY_SYMBOLS[watchSalaryCurrency]}
                      </span>
                      <Input
                        id="salaryMin"
                        type="number"
                        min={0}
                        placeholder="0"
                        className="pl-8"
                        value={watchSalaryMin ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue('salaryMin', val ? parseInt(val) : null);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="salaryMax" className="text-xs text-muted-foreground">Maximum</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {CURRENCY_SYMBOLS[watchSalaryCurrency]}
                      </span>
                      <Input
                        id="salaryMax"
                        type="number"
                        min={0}
                        placeholder="No max"
                        className="pl-8"
                        value={watchSalaryMax ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue('salaryMax', val ? parseInt(val) : null);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {watchSalaryMin && watchSalaryMax
                    ? `${CURRENCY_SYMBOLS[watchSalaryCurrency]}${watchSalaryMin.toLocaleString()} - ${CURRENCY_SYMBOLS[watchSalaryCurrency]}${watchSalaryMax.toLocaleString()} ${SALARY_PERIOD_LABELS[watchSalaryPeriod]}`
                    : watchSalaryMin
                    ? `From ${CURRENCY_SYMBOLS[watchSalaryCurrency]}${watchSalaryMin.toLocaleString()} ${SALARY_PERIOD_LABELS[watchSalaryPeriod]}`
                    : watchSalaryMax
                    ? `Up to ${CURRENCY_SYMBOLS[watchSalaryCurrency]}${watchSalaryMax.toLocaleString()} ${SALARY_PERIOD_LABELS[watchSalaryPeriod]}`
                    : 'Salary not specified'}
                </p>
                {errors.salaryMin && (
                  <p className="text-destructive text-sm">{errors.salaryMin.message}</p>
                )}
                {errors.salaryMax && (
                  <p className="text-destructive text-sm">{errors.salaryMax.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Expiration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Expiration
                </CardTitle>
                <CardDescription>
                  Optional expiration date for the posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DateTimePicker
                  dateLabel="Expires At"
                  timeLabel="Time"
                  placeholder="Select expiration date"
                  value={watch('expiresAt') ? new Date(watch('expiresAt') as string) : null}
                  onChange={(date) => {
                    setValue('expiresAt', date ? date.toISOString() : '');
                  }}
                  disabled={isLoading}
                  minDate={new Date()}
                />
                {errors.expiresAt && (
                  <p className="text-destructive text-sm">{errors.expiresAt.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
                <CardDescription>
                  Control whether this job is visible to applicants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPublished">Publish Job</Label>
                    <p className="text-sm text-muted-foreground">
                      {watchIsPublished
                        ? 'This job is visible to applicants'
                        : 'This job is hidden from applicants'}
                    </p>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={watchIsPublished}
                    onCheckedChange={(checked) => setValue('isPublished', checked)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Job' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard/jobs')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
