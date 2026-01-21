'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HtmlCodeEditor } from '@/components/ui/code-editor';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Mail,
  MailCheck,
  MailX,
  Pencil,
  RotateCcw,
  Loader2,
  Eye,
  Code,
  Info,
  Copy,
  Check,
  CalendarCheck,
  Gift,
  RefreshCw,
  FileSearch,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBreadcrumbs, useAuth } from '@/context';
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  useToggleEmailTemplate,
  useResetEmailTemplate,
} from '@/hooks/use-email-templates';
import type { EmailTemplate, EmailTemplatePlaceholder } from '@/lib/email-templates';
import { AccessDenied } from '@/components/admin/access-denied';
import { Skeleton } from '@/components/ui/skeleton';

// Template type display names and descriptions
const TEMPLATE_INFO: Record<
  string,
  { name: string; description: string; icon: LucideIcon; color: string }
> = {
  APPLICATION_CONFIRMATION: {
    name: 'Application Confirmation',
    description: 'Sent when an applicant submits a job application',
    icon: MailCheck,
    color: 'text-green-600 bg-green-100',
  },
  APPLICATION_REVIEWED: {
    name: 'Application Reviewed',
    description: 'Sent when an application status is updated to reviewed',
    icon: FileSearch,
    color: 'text-blue-600 bg-blue-100',
  },
  APPLICATION_REJECTION: {
    name: 'Application Rejection',
    description: 'Sent when an application is rejected',
    icon: MailX,
    color: 'text-red-600 bg-red-100',
  },
  INTERVIEW_INVITATION: {
    name: 'Interview Invitation',
    description: 'Sent when inviting a candidate to an interview',
    icon: CalendarCheck,
    color: 'text-purple-600 bg-purple-100',
  },
  JOB_OFFER: {
    name: 'Job Offer',
    description: 'Sent when sending a job offer to a candidate',
    icon: Gift,
    color: 'text-amber-600 bg-amber-100',
  },
  APPLICATION_FOLLOW_UP: {
    name: 'Application Follow-up',
    description: 'Sent as a follow-up to applicants',
    icon: RefreshCw,
    color: 'text-cyan-600 bg-cyan-100',
  },
};

export default function EmailTemplatesPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);
  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);

  // React Query hooks
  const { data, isLoading, error } = useEmailTemplates();
  const updateMutation = useUpdateEmailTemplate();
  const toggleMutation = useToggleEmailTemplate();
  const resetMutation = useResetEmailTemplate();

  const templates = data?.templates || [];
  const placeholders = data?.placeholders || {};

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Email Templates' },
    ]);
  }, [setBreadcrumbs]);

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.body);
    setPreviewMode('code');
  };

  const handleCloseEdit = () => {
    setEditingTemplate(null);
    setEditSubject('');
    setEditBody('');
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        data: {
          subject: editSubject,
          body: editBody,
        },
      });
      toast.success('Template updated successfully');
      handleCloseEdit();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update template');
    }
  };

  const handleToggle = async (template: EmailTemplate) => {
    try {
      await toggleMutation.mutateAsync(template.id);
      toast.success(`Template ${template.isActive ? 'disabled' : 'enabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle template');
    }
  };

  const handleReset = async (id: string) => {
    try {
      await resetMutation.mutateAsync(id);
      toast.success('Template reset to default successfully');
      setResetConfirmId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset template');
    }
  };

  const copyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    setCopiedPlaceholder(placeholder);
    setTimeout(() => setCopiedPlaceholder(null), 2000);
  };

  const renderPreview = (body: string) => {
    // Replace placeholders with sample data for preview
    const sampleData: Record<string, string> = {
      '{{applicantName}}': 'John Doe',
      '{{jobTitle}}': 'Senior Software Engineer',
      '{{jobNumber}}': 'JN-0001',
      '{{companyLocation}}': 'Makati City',
      '{{jobUrl}}': '#',
      '{{interviewDate}}': 'January 25, 2026',
      '{{interviewTime}}': '10:00 AM',
      '{{interviewType}}': 'Video Call (Google Meet)',
      '{{interviewLocation}}': 'https://meet.google.com/abc-defg-hij',
      '{{salaryDisplay}}': '₱80,000 per month',
      '{{startDate}}': 'February 1, 2026',
      '{{additionalNotes}}': 'Please bring a valid ID.',
    };

    let previewHtml = body;
    Object.entries(sampleData).forEach(([key, value]) => {
      previewHtml = previewHtml.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Remove Handlebars conditionals for preview
    previewHtml = previewHtml.replace(/\{\{#if\s+\w+\}\}/g, '');
    previewHtml = previewHtml.replace(/\{\{\/if\}\}/g, '');

    return previewHtml;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load email templates</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Customize the email templates sent to applicants
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Email Templates</p>
            <p className="text-blue-700">
              These templates are used for application-related emails only. Use placeholders like{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{'{{applicantName}}'}</code>{' '}
              to insert dynamic content. Disabled templates will use the system default.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-72" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Skeleton className="h-14 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No email templates found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run the database seed to create default templates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const info = TEMPLATE_INFO[template.type] || {
              name: template.name,
              description: '',
              icon: Mail,
              color: 'text-gray-600 bg-gray-100',
            };
            const IconComponent = info.icon;
            return (
              <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${info.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {info.name}
                        </CardTitle>
                        <CardDescription className="mt-1">{info.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => handleToggle(template)}
                        disabled={toggleMutation.isPending}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Subject
                    </Label>
                    <p className="mt-1 font-medium">{template.subject}</p>
                  </div>

                  {/* Placeholders */}
                  {placeholders[template.type] && (
                    <Accordion type="single" collapsible className="mb-4">
                      <AccordionItem value="placeholders" className="border-none">
                        <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                          Available Placeholders ({placeholders[template.type].length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {placeholders[template.type].map((p: EmailTemplatePlaceholder) => (
                              <button
                                key={p.name}
                                onClick={() => copyPlaceholder(p.name)}
                                className="flex items-center justify-between gap-2 text-left p-2 rounded-md border hover:bg-muted/50 transition-colors group"
                              >
                                <div className="min-w-0">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    {p.name}
                                  </code>
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {p.description}
                                  </p>
                                </div>
                                {copiedPlaceholder === p.name ? (
                                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                                ) : (
                                  <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewingTemplate(template)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetConfirmId(template.id)}
                      disabled={resetMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Edit Template: {editingTemplate && TEMPLATE_INFO[editingTemplate.type]?.name}
            </DialogTitle>
            <DialogDescription>
              Customize the email subject and body. Use placeholders for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            {/* Body with Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Email Body (HTML)</Label>
                <Tabs
                  value={previewMode}
                  onValueChange={(v) => setPreviewMode(v as 'code' | 'preview')}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="code" className="text-xs px-3">
                      <Code className="h-3 w-3 mr-1" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs px-3">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {previewMode === 'code' ? (
                <HtmlCodeEditor
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Enter HTML email body..."
                  minHeight="400px"
                />
              ) : (
                <div className="border rounded-lg p-4 min-h-[400px] bg-white overflow-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderPreview(editBody) }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              )}
            </div>

            {/* Available Placeholders */}
            {editingTemplate && placeholders[editingTemplate.type] && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Click a placeholder to copy it
                </Label>
                <div className="flex flex-wrap gap-2">
                  {placeholders[editingTemplate.type].map((p: EmailTemplatePlaceholder) => (
                    <button
                      key={p.name}
                      onClick={() => copyPlaceholder(p.name)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-muted/50 transition-colors text-xs"
                      title={p.description}
                    >
                      <code>{p.name}</code>
                      {copiedPlaceholder === p.name ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewingTemplate} onOpenChange={(open) => !open && setPreviewingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewingTemplate && TEMPLATE_INFO[previewingTemplate.type] && (
                <>
                  {(() => {
                    const info = TEMPLATE_INFO[previewingTemplate.type];
                    const IconComponent = info.icon;
                    return (
                      <div className={`p-1.5 rounded ${info.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                    );
                  })()}
                </>
              )}
              Preview: {previewingTemplate && TEMPLATE_INFO[previewingTemplate.type]?.name}
            </DialogTitle>
            <DialogDescription>
              This is how the email will appear to recipients (with sample data).
            </DialogDescription>
          </DialogHeader>

          {previewingTemplate && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Subject Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Subject
                </Label>
                <p className="mt-1 font-medium">
                  {renderPreview(previewingTemplate.subject)}
                </p>
              </div>

              {/* Body Preview */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email Body
                </Label>
                <div className="border rounded-lg p-6 bg-white min-h-[300px] overflow-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderPreview(previewingTemplate.body) }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setPreviewingTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => {
              if (previewingTemplate) {
                handleEdit(previewingTemplate);
                setPreviewingTemplate(null);
              }
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={!!resetConfirmId} onOpenChange={(open) => !open && setResetConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Template to Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the email template to its original content. Your customizations will
              be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetConfirmId && handleReset(resetConfirmId)}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
