// src/app/(app)/agency/[agencyId]/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Settings } from 'lucide-react';
import ThemeSelector from '@/components/agency/ThemeSelector';
import DeleteAgencyDialog from '@/components/agency/DeleteAgencyDialog';
import { DatabaseTables } from '@/lib/constants/databaseTables';

export default function AgencySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const agencyId = params.agencyId as string;
  const [agencyName, setAgencyName] = useState('');
  const [agencyOwnerId, setAgencyOwnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!agencyId) return;
    const fetchAgency = async () => {
      const docRef = doc(db, DatabaseTables.agency, agencyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAgencyName(data.name);
        setAgencyOwnerId(data.ownerId);
      }
      setLoading(false);
    };
    fetchAgency();
  }, [agencyId]);

  const handleAgencyDeleted = () => {
    router.push('/agency');
  };

  const canDeleteAgency = user?.uid === agencyOwnerId;

  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings for {agencyName}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of your agency's workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector agencyId={agencyId} />
        </CardContent>
      </Card>

      {canDeleteAgency && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions for your agency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-medium text-destructive mb-2">Delete Agency</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete this agency and all associated data including members, clients, and content. 
                  This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agency
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DeleteAgencyDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        agencyId={agencyId}
        agencyName={agencyName}
        onAgencyDeleted={handleAgencyDeleted}
      />
    </div>
  );
}
