'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  sendApplicantEmail,
  sendTemplateEmailToApplicant,
  type EmailTemplateType,
  type EmailTemplateData,
} from '@/lib/applications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Send,
  FileText,
  Calendar,
  MapPin,
  Video,
  Loader2,
  XCircle,
  UserCheck,
  MessageSquare,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobNumber: string;
  // Job salary data for offer template
  jobSalaryMin?: number | null;
  jobSalaryMax?: number | null;
  jobSalaryPeriod?: string | null;
  jobSalaryCurrency?: string | null;
  // Application status - when hired, only allow compose
  applicationStatus?: string;
}

const EMAIL_TEMPLATES: {
  type: EmailTemplateType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
    {
      type: 'interview_invitation',
      label: 'Interview Invitation',
      description: 'Invite the candidate to an interview',
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      type: 'rejection',
      label: 'Application Update',
      description: 'Politely decline the application',
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-red-600 bg-red-50',
    },
    {
      type: 'offer',
      label: 'Job Offer',
      description: 'Extend a job offer to the candidate',
      icon: <UserCheck className="h-5 w-5" />,
      color: 'text-green-600 bg-green-50',
    },
    {
      type: 'follow_up',
      label: 'Follow Up',
      description: 'Send an application status update',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-yellow-600 bg-yellow-50',
    },
  ];

export function EmailComposeDialog({
  open,
  onOpenChange,
  applicationId,
  applicantName,
  applicantEmail,
  jobTitle,
  jobNumber,
  jobSalaryMin,
  jobSalaryMax,
  jobSalaryPeriod,
  jobSalaryCurrency,
  applicationStatus,
}: EmailComposeDialogProps) {
  const queryClient = useQueryClient();
  const isHired = applicationStatus === 'hired';
  const [activeTab, setActiveTab] = useState<'compose' | 'template'>(isHired ? 'compose' : 'template');

  // Custom email state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType | ''>('');
  const [templateData, setTemplateData] = useState<EmailTemplateData>({});
  const [interviewDateTime, setInterviewDateTime] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  // Pre-fill salary from job data when selecting offer template
  const handleTemplateSelect = (templateType: EmailTemplateType) => {
    setSelectedTemplate(templateType);

    // Pre-fill salary fields for offer template
    if (templateType === 'offer' && (jobSalaryMin || jobSalaryMax)) {
      setTemplateData(prev => ({
        ...prev,
        salaryCurrency: jobSalaryCurrency || 'PHP',
        salaryPeriod: jobSalaryPeriod || 'MONTHLY',
        // Use max salary as the offer amount, or min if no max
        salaryAmount: (jobSalaryMax || jobSalaryMin)?.toString() || '',
      }));
    }
  };

  const customEmailMutation = useMutation({
    mutationFn: () => sendApplicantEmail(applicationId, { subject, message }),
    onSuccess: () => {
      toast.success('Email sent successfully');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send email');
    },
  });

  const templateEmailMutation = useMutation({
    mutationFn: () => sendTemplateEmailToApplicant(applicationId, {
      templateType: selectedTemplate as EmailTemplateType,
      customData: templateData,
    }),
    onSuccess: (data) => {
      // Show appropriate message based on template type
      const messages: Record<string, string> = {
        'rejection': 'Email sent and application marked as rejected',
        'interview_invitation': 'Email sent and application marked as shortlisted',
        'offer': 'Offer email sent successfully',
        'follow_up': 'Follow-up email sent successfully',
      };
      toast.success(messages[selectedTemplate] || 'Email sent successfully');

      // Refresh application data
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send email');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setTimeout(() => {
      setSubject('');
      setMessage('');
      setSelectedTemplate('');
      setTemplateData({});
      setInterviewDateTime(undefined);
      setStartDate(undefined);
      setActiveTab(isHired ? 'compose' : 'template');
    }, 300);
  };

  const handleSendCustomEmail = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }
    customEmailMutation.mutate();
  };

  const handleSendTemplateEmail = () => {
    if (!selectedTemplate) {
      toast.error('Please select an email template');
      return;
    }
    templateEmailMutation.mutate();
  };

  const isPending = customEmailMutation.isPending || templateEmailMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl! h-[90vh]! flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email to <strong>{applicantName}</strong> ({applicantEmail})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'compose' | 'template')} className="flex flex-col flex-1 min-h-0">
          {/* Fixed Tabs */}
          <div className="px-6 pt-4 flex-shrink-0">
            {isHired ? (
              <div className="text-sm text-muted-foreground mb-2">
                Templates are disabled for hired candidates. You can send a custom email.
              </div>
            ) : (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Use Template
                </TabsTrigger>
                <TabsTrigger value="compose" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Compose
                </TabsTrigger>
              </TabsList>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Template Tab */}
            <TabsContent value="template" className="space-y-4 mt-0 data-[state=inactive]:hidden">
              <div className="grid gap-3 sm:grid-cols-2">
                {EMAIL_TEMPLATES.map((template) => (
                  <Card
                    key={template.type}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate === template.type
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                      }`}
                    onClick={() => handleTemplateSelect(template.type)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${template.color}`}>
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{template.label}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Template-specific fields */}
              {selectedTemplate === 'interview_invitation' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Interview Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        Date & Time
                      </Label>
                      <DateTimePicker
                        value={interviewDateTime}
                        onChange={(date) => {
                          setInterviewDateTime(date || undefined);
                          if (date) {
                            setTemplateData({
                              ...templateData,
                              interviewDate: format(date, 'MMMM d, yyyy'),
                              interviewTime: format(date, 'h:mm a'),
                            });
                          } else {
                            setTemplateData({
                              ...templateData,
                              interviewDate: undefined,
                              interviewTime: undefined,
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs">
                          <Video className="h-3 w-3" />
                          Format
                        </Label>
                        <Select
                          value={templateData.interviewType || ''}
                          onValueChange={(v) => setTemplateData({ ...templateData, interviewType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In-Person">In-Person</SelectItem>
                            <SelectItem value="Video Call">Video Call</SelectItem>
                            <SelectItem value="Phone Call">Phone Call</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3" />
                          Location / Link
                        </Label>
                        <Input
                          placeholder="Office address or meeting link"
                          value={templateData.interviewLocation || ''}
                          onChange={(e) => setTemplateData({ ...templateData, interviewLocation: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Additional Notes (optional)</Label>
                      <Textarea
                        placeholder="Any additional information..."
                        value={templateData.additionalNotes || ''}
                        onChange={(e) => setTemplateData({ ...templateData, additionalNotes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedTemplate === 'offer' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Job Offer Details</CardTitle>
                    <CardDescription className="text-xs">
                      Position: <span className="font-medium text-foreground">{jobTitle}</span> ({jobNumber})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Show job salary range as reference */}
                    {(jobSalaryMin || jobSalaryMax) && (
                      <div className="bg-muted/50 border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Job Posting Salary Range:</p>
                        <p className="text-sm font-medium">
                          {(() => {
                            const symbols: Record<string, string> = { PHP: '₱', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$' };
                            const periods: Record<string, string> = { HOURLY: '/hr', MONTHLY: '/mo', YEARLY: '/yr' };
                            const symbol = symbols[jobSalaryCurrency || 'PHP'] || '₱';
                            const period = periods[jobSalaryPeriod || 'MONTHLY'] || '/mo';
                            if (jobSalaryMin && jobSalaryMax) {
                              return `${symbol}${jobSalaryMin.toLocaleString()} - ${symbol}${jobSalaryMax.toLocaleString()} ${period}`;
                            }
                            return `${symbol}${(jobSalaryMax || jobSalaryMin)?.toLocaleString()} ${period}`;
                          })()}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs">
                        <DollarSign className="h-3 w-3" />
                        Salary Offer
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Select
                          value={templateData.salaryCurrency || 'PHP'}
                          onValueChange={(v) => setTemplateData({ ...templateData, salaryCurrency: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PHP">PHP (₱)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="AUD">AUD ($)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                            <SelectItem value="SGD">SGD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={templateData.salaryAmount || ''}
                          onChange={(e) => setTemplateData({ ...templateData, salaryAmount: e.target.value })}
                          className="sm:col-span-1"
                        />
                        <Select
                          value={templateData.salaryPeriod || 'MONTHLY'}
                          onValueChange={(v) => setTemplateData({ ...templateData, salaryPeriod: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOURLY">Per Hour</SelectItem>
                            <SelectItem value="MONTHLY">Per Month</SelectItem>
                            <SelectItem value="YEARLY">Per Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs">
                        <Briefcase className="h-3 w-3" />
                        Proposed Start Date (optional)
                      </Label>
                      <DateTimePicker
                        value={startDate}
                        onChange={(date) => {
                          setStartDate(date || undefined);
                          if (date) {
                            setTemplateData({
                              ...templateData,
                              startDate: format(date, 'MMMM d, yyyy'),
                            });
                          } else {
                            setTemplateData({
                              ...templateData,
                              startDate: undefined,
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Additional Notes (optional)</Label>
                      <Textarea
                        placeholder="Benefits, perks, or any additional information..."
                        value={templateData.additionalNotes || ''}
                        onChange={(e) => setTemplateData({ ...templateData, additionalNotes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedTemplate === 'follow_up' && (
                <div className="space-y-2">
                  <Label className="text-sm">Additional Notes (optional)</Label>
                  <Textarea
                    placeholder="Any additional information to include in the email..."
                    value={templateData.additionalNotes || ''}
                    onChange={(e) => setTemplateData({ ...templateData, additionalNotes: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
            </TabsContent>

            {/* Compose Tab */}
            <TabsContent value="compose" className="space-y-4 mt-0 data-[state=inactive]:hidden">
              <div className="space-y-2">
                <Label>To</Label>
                <Input
                  value={`${applicantName} <${applicantEmail}>`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Regarding</Label>
                <Input
                  value={`${jobTitle} (${jobNumber})`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <RichTextEditor
                  value={message}
                  onChange={setMessage}
                  placeholder="Write your message..."
                  disabled={isPending}
                />
              </div>
            </TabsContent>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t flex-shrink-0 bg-background">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={activeTab === 'template' ? handleSendTemplateEmail : handleSendCustomEmail}
                disabled={
                  activeTab === 'template'
                    ? !selectedTemplate || isPending
                    : !subject.trim() || !message.trim() || isPending
                }
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
