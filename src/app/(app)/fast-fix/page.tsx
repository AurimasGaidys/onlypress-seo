'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';

export default function FastFixPage() {
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fast-fix/migrate', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agencies data');
      }

      const data = await response.json();
      console.log('Agencies data:', data);
      toast.success(`Successfully loaded ${data.count} agencies. Check console for details.`);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      toast.error('Failed to load agencies data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-6">Fast Fix</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Migration</CardTitle>
              <CardDescription>Load and migrate agency data from the database</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleMigrate} 
                disabled={loading}
                size="lg"
              >
                {loading ? 'Loading...' : 'Migrate'}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Click the button to load all agencies data from the database. Results will be printed to the console.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
