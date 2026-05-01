// src/components/agency/ContactDetailsEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, CheckCircle, Mail, Phone } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DatabaseTables } from '@/lib/constants/databaseTables';
import { toast } from 'sonner';

interface ContactDetailsEditorProps {
  agencyId: string;
  email?: string;
  phone?: string;
}

export default function ContactDetailsEditor({ agencyId, email, phone }: ContactDetailsEditorProps) {
  const [formEmail, setFormEmail] = useState(email || '');
  const [formPhone, setFormPhone] = useState(phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormEmail(email || '');
    setFormPhone(phone || '');
    setHasChanges(false);
  }, [email, phone]);

  const handleEmailChange = (value: string) => {
    setFormEmail(value);
    setHasChanges(true);
    if (errors.email) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormPhone(value);
    setHasChanges(true);
    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formPhone && !/^[+]?[\d\s()-]{6,20}$/.test(formPhone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      const agencyRef = doc(db, DatabaseTables.agencyPrivate, agencyId);

      await updateDoc(agencyRef, {
        email: formEmail.trim(),
        phone: formPhone.trim(),
        updated: serverTimestamp(),
      });

      setHasChanges(false);
      toast.success('Contact details saved successfully');
    } catch (error) {
      console.error('Error saving contact details:', error);
      toast.error('Failed to save contact details');
    } finally {
      setIsSaving(false);
    }
  };

  const hasSavedData = !!(email || phone);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Details</CardTitle>
        <CardDescription>
          Company email and phone number used for communication and invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="contact-email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={formEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="company@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              value={formPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+370 600 00000"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>Unsaved changes</span>
              </>
            ) : hasSavedData ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>All changes saved</span>
              </>
            ) : null}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
