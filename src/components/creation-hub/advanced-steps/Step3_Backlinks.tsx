'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Link, PlusCircle } from 'lucide-react';

interface Step3BacklinksProps {
  backlinks: string[];
  updateFormData: (updates: { backlinks: string[] }) => void;
}

export default function Step3_Backlinks({
  backlinks,
  updateFormData,
}: Step3BacklinksProps) {
  const [currentUrl, setCurrentUrl] = useState('');

  const addBacklink = (url: string) => {
    const trimmedUrl = url.trim();
    if (trimmedUrl && !backlinks.includes(trimmedUrl) && backlinks.length < 2) {
      // Basic URL validation
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        updateFormData({ backlinks: [...backlinks, trimmedUrl] });
      } else {
        // Add https:// if missing
        const fullUrl = `https://${trimmedUrl}`;
        updateFormData({ backlinks: [...backlinks, fullUrl] });
      }
    }
  };

  const removeBacklink = (url: string) => {
    updateFormData({ backlinks: backlinks.filter(link => link !== url) });
  };

  const handleAddClick = () => {
    if (currentUrl.trim()) {
      addBacklink(currentUrl);
      setCurrentUrl('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          Step 3: Backlinks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input for adding backlinks */}
        <div className="space-y-2">
          <Label htmlFor="backlink" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            Add Backlink URL ({backlinks.length}/2)
          </Label>
          <div className="flex gap-2">
            <Input
              id="backlink"
              placeholder="https://example.com/article-link"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={backlinks.length >= 2}
            />
            <Button
              type="button"
              onClick={handleAddClick}
              disabled={!currentUrl.trim() || backlinks.length >= 2}
            >
              Add Link
            </Button>
          </div>
          {backlinks.length >= 2 ? (
            <p className="text-xs text-muted-foreground">
              Maximum of 2 backlinks allowed.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              The AI will naturally weave these links into the article content where relevant.
            </p>
          )}
        </div>

        {/* List of added backlinks */}
        {backlinks.length > 0 && (
          <div className="space-y-2">
            <Label>Added Backlinks ({backlinks.length})</Label>
            <div className="space-y-2">
              {backlinks.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/10"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm truncate flex-1"
                  >
                    {url}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBacklink(url)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
}
