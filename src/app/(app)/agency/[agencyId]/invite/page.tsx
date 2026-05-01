// src/app/(app)/agency/[agencyId]/invite/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Users, Building, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = params.agencyId as string;
  const email = searchParams.get('email');

  const { user } = useAuth();

  const [isAccepting, setIsAccepting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(email || '');

  useEffect(() => {
    if (email) {
      setInviteEmail(email);
    }
  }, [email]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("You have been logged out.");
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out.");
    }
  };

  // Handle existing user accepting invite
  const handleAcceptInvite = async () => {
    if (!user || !inviteEmail) return;

    setIsAccepting(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/agency/accept-existing-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          agencyId,
          email: inviteEmail
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Invitation not found or has expired");
        } else if (response.status === 409) {
          toast.error("You're already a member of this agency");
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast.success("You have successfully joined the agency! Redirecting...");

      // Nukreipiame į agency puslapį po sėkmingo priėmimo
      setTimeout(() => {
        router.push(`/agency/${agencyId}`);
      }, 2000);

    } catch (error) {
      toast.error("Failed to accept invitation", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Jei vartotojas jau prisijungęs ir email matchina
  if (user && user.email === inviteEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Accept Invitation
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                You're logged in as <strong>{user.email}</strong>.
                Click below to join the agency team.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                onClick={handleAcceptInvite}
                className="w-full"
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting Invitation...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Accept Invitation & Join Team
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => router.push('/agency')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel and go to agencies
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user && user.email !== inviteEmail) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Ups!
            </CardTitle>
            <p className="text-l text-gray-600 mt-2">
              Wrong email</p>
          </CardHeader>

          <CardContent> <div className="text-center p-2 space-y-4">

            <p className="text-sm text-gray-600">
              You are currently loggedin with <b>{user.email}</b>, but the invite was sent to a different email: <b>{inviteEmail}</b>
            </p>
            <p className="text-sm text-gray-600">
              Please logout and sign in with the invited email and open link again.
            </p>
            <div>
            </div>

            <Button
              onClick={() => { handleLogout() }}
              className="w-full"
            >
              Logout now
            </Button>

          </div></CardContent>
        </Card>
      </div>
    </div>;
  }

  // Jei nėra vartotojo
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Something went terribly wrong
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              No user detected
            </p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
