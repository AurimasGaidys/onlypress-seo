'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, FileCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Step4Props {
  handleFinish: () => void;
  isSubmitting: boolean;
}

export default function Step4_Generate({ handleFinish, isSubmitting }: Step4Props) {
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsSimulating(false), 1500); // Shorter simulation
    return () => clearTimeout(timer);
  }, []);

  const displayContent = isSimulating || isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Finalizing your document</CardTitle>
        <CardDescription>
          {displayContent ? "The AI is working its magic..." : "Your new document is ready!"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayContent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[200px] space-y-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="font-semibold">
              {isSubmitting ? "Saving to database..." : "Writing in progress..."}
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
            <FileCheck className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold">Ready to Go!</h3>
            <p className="text-muted-foreground text-center">Click the button below to open your new document in the editor.</p>
            <Button onClick={handleFinish} disabled={isSubmitting} className="mt-4">
              Open Document
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
