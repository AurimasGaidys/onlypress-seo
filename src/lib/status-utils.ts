export interface StatusInfo {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  label: string;
}

export const getStatusInfo = (status: 'draft' | 'scheduled' | 'in-review' | 'rejected' | 'approved' | 'published' | "Created" | "Paid" | "Rejected" | "Completed"): StatusInfo => {
  switch (status) {
    case 'scheduled':
      return {
        variant: 'default' as const,
        className: 'bg-cyan-500 text-white border-cyan-600',
        label: 'Scheduled'
      };
    case 'in-review':
      return {
        variant: 'default' as const,
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        label: 'In Review'
      };
    case 'approved':
      return {
        variant: 'default' as const,
        className: 'bg-green-500/10 text-green-600 border-green-500/20',
        label: 'Approved'
      };
    case 'published':
      return {
        variant: 'secondary' as const,
        className: '',
        label: 'Published'
      };
    case 'Rejected':
      return {
        variant: 'destructive' as const,
        className: '',
        label: 'Rejected'
      };
    case 'Created':
      return {
        variant: 'default' as const,
        className: 'text-white',
        label: 'Created'
      };
    case 'Paid':
      return {
        variant: 'secondary' as const,
        className: '',
        label: 'Paid'
      };
    case 'Completed':
      return {
        variant: 'default' as const,
        className: 'bg-green-500 text-white border-green-600',
        label: 'Completed'
      };
    case 'draft':
    default:
      return {
        variant: 'default' as const,
        className: 'text-white',
        label: 'Draft'
      };

  }
};
