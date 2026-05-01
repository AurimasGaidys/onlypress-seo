// src/components/agency/SettingsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import DeleteAgencyDialog from './DeleteAgencyDialog';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agency } from '@/types/agency';
import { AgencyPrivate } from '@/types/agencyPrivate';
import { DatabaseTables } from '@/lib/constants/databaseTables';
import TaxDetailsEditor from './TaxDetailsEditor';
import ContactDetailsEditor from './ContactDetailsEditor';


interface SettingsTabProps {
  agencyId: string;
  agency: Agency;
  agencyPrivate: AgencyPrivate;
}

export default function SettingsTab({ agencyId, agency, agencyPrivate }: SettingsTabProps) {
  const { user } = useAuth();
  const [currentAgency, setCurrentAgency] = useState(agency);
  const [currentAgencyPrivate, setCurrentAgencyPrivate] = useState(agencyPrivate);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Real-time agency duomenų klausymas
  useEffect(() => {
    if (!agencyId) return;

    const unsubscribe = onSnapshot(doc(db, DatabaseTables.agency, agencyId), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentAgency({ id: docSnap.id, ...docSnap.data() } as Agency);
      }
    });

    const unsubscribe2 = onSnapshot(doc(db, DatabaseTables.agencyPrivate, agencyId), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentAgencyPrivate({ id: docSnap.id, ...docSnap.data() } as AgencyPrivate);
      }
    });

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, [agencyId]);

  const canDeleteAgency = user?.uid === agencyPrivate?.ownerId;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
          <CardDescription>Basic information about your agency.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Agency Name:</span>
              <span className="ml-2">{currentAgency?.name}</span>
            </div>
            <div>
              <span className="font-medium">Agency ID:</span>
              <span className="ml-2">{currentAgency?.id}</span>
            </div>
            <div>
              <span className="font-medium">Owner:</span>
              <span className="ml-2">{user?.uid === currentAgencyPrivate?.ownerId ? 'You' : currentAgencyPrivate?.ownerId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContactDetailsEditor
        agencyId={agencyId}
        email={currentAgencyPrivate?.email}
        phone={currentAgencyPrivate?.phone}
      />

      <TaxDetailsEditor 
        agencyId={agencyId} 
        taxDetails={currentAgencyPrivate?.taxDetails}
      />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize look and feel of your agency&apos;s workspace.</CardDescription>
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
        agencyName={currentAgency?.name || ''}
        onAgencyDeleted={() => {
          // Redirect į agency sąrašą po ištrynimo
          window.location.href = '/agency';
        }}
      />
    </div>
  );
}
