'use client';

import { useState } from 'react';
import { PortalPublic } from '@/types/portalPublic';
import { PortalVariant } from '@/types/document';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Sparkles,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface PortalEditorPanelProps {
  portal: PortalPublic;
  variant: PortalVariant | undefined;
  originalContent: string;
  originalTitle: string;
  documentId: string;
  onRewriteComplete: () => void;
}

export default function PortalEditorPanel({
  portal,
  variant,
  originalContent,
  originalTitle,
  documentId,
  onRewriteComplete,
}: PortalEditorPanelProps) {
  const { user } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const displayTitle = portal.title || portal.description || 'Unknown Portal';
  const displayDomain = portal.domain || portal.domain || '';
  
  const handleRewrite = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsRegenerating(true);
    
    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/documents/rewrite-for-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          documentId,
          portalId: portal.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to rewrite article');
      }

      toast.success(`Article successfully rewritten for ${displayTitle}`);
      onRewriteComplete();
      
    } catch (error) {
      console.error('Error rewriting article:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to rewrite article');
    } finally {
      setIsRegenerating(false);
    }
  };

  const status = variant?.status || 'pending';
  const hasContent = variant?.content && variant.content.length > 0;

  const getStatusInfo = () => {
    switch (status) {
      case 'generated': return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Generated' };
      case 'generating': return { icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />, text: 'Generating...' };
      case 'published': return { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, text: 'Published' };
      case 'failed': return { icon: <XCircle className="h-4 w-4 text-destructive" />, text: 'Failed' };
      case 'pending':
      default: return { icon: <Clock className="h-4 w-4 text-muted-foreground" />, text: 'Pending' };
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* NAUJA KOMPAKTIŠKA ANTRAŠTĖ */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold">{displayTitle}</h3>
            <a href={displayDomain.startsWith('http') ? displayDomain : `https://${displayDomain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">{displayDomain}</a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getStatusInfo().icon}
            <span>{getStatusInfo().text}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className='text-xs text-muted-foreground'>
                <p>Negalimos temos:</p>
                <p className='font-bold'>{portal.weDoNotPublishThemes || 'Nėra'}</p>
            </div>
          <Button onClick={handleRewrite} disabled={isRegenerating} className="gap-2">
            {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {hasContent ? 'Regenerate with AI' : 'Generate with AI'}
          </Button>
        </div>
      </div>
      {/* ANTRAŠTĖS PABAIGA */}

      {/* Split View - Original vs Generated */}
      <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x">
        {/* Original Content */}
        <div className="flex flex-col h-full">
          <div className="p-3 bg-muted/30 border-b">
            <h4 className="text-sm font-semibold">Original Article</h4>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <h2 className="text-2xl font-bold mb-4">{originalTitle}</h2>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: originalContent }}
            />
          </div>
        </div>

        {/* Generated Content */}
        <div className="flex flex-col h-full">
          <div className="p-3 bg-muted/30 border-b">
            <h4 className="text-sm font-semibold">Rewritten Version</h4>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {hasContent ? (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  {variant.title || originalTitle}
                </h2>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: variant.content }}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  Article not generated yet
                </p>
                <p className="text-sm max-w-md">
                  Click the "Generate with AI" button to create a customized version of the article for {displayTitle}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
