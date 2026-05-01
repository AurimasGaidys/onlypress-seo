import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { PortalPublic } from '@/types/portalPublic';
import { useDocument } from '@/hooks/useDocument';
import { auth } from '@/lib/firebase';

interface PortalCompatibilityProps {
  documentId: string;
}

export default function PortalCompatibility({ documentId }: PortalCompatibilityProps) {
  const { document } = useDocument(documentId);
  const [portals, setPortals] = useState<PortalPublic[]>([]);
  const [detectedCategories, setDetectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const analyzePortals = async () => {
    if (!document || !document.content) {
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    const idToken = await user.getIdToken();

    setIsLoading(true);

    try {
      const response = await fetch('/api/content-analysis/check-compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: document.content,
          idToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const result = await response.json();
      setPortals(result.portals);
      setDetectedCategories(result.detectedCategories);
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-analyze when component mounts if document has content
    if (document?.content && portals.length === 0) {
      analyzePortals();
    }
  }, [document?.content]);

  const getCompatibilityIcon = (isCompatible: boolean) => {
    return isCompatible ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getCompatibilityText = (isCompatible: boolean) => {
    return isCompatible ? 'Compatible' : 'Incompatible';
  };

  const compatibleCount = 28; // portals.filter(p => p.isCompatible).length;
  const totalCount = portals.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Portal Compatibility
          </h3>
          <p className="text-sm text-muted-foreground">
            Check which portals are suitable for your content based on detected categories.
          </p>
        </div>
        <Button onClick={analyzePortals} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Analyze Content
        </Button>
      </div>

      {detectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detected Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detectedCategories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {portals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Portal Results ({compatibleCount}/{totalCount} compatible)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portals.map((portal) => (
                <div
                  key={portal.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getCompatibilityIcon(portal.isCompatible)}
                      <h4 className="font-medium">{portal.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {portal.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {portal.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        portal.isCompatible ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {getCompatibilityText(portal.isCompatible)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {portals.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
<p>Click &ldquo;Analyze Content&rdquo; to check portal compatibility</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
