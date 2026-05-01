// src/components/agency/TaxDetailsEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserTaxDetails, UserTaxDetailsSchema } from '@/types/agencyPrivate';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DatabaseTables } from '@/lib/constants/databaseTables';
import { toast } from 'sonner';

interface TaxDetailsEditorProps {
  agencyId: string;
  taxDetails?: UserTaxDetails;
}

export default function TaxDetailsEditor({ agencyId, taxDetails }: TaxDetailsEditorProps) {
  const [formData, setFormData] = useState<Partial<UserTaxDetails>>({
    id: taxDetails?.id || agencyId,
    type: taxDetails?.type || 'company',
    name: taxDetails?.name || '',
    adress: taxDetails?.adress || '',
    companyCode: taxDetails?.companyCode || '',
    city: taxDetails?.city || '',
    postalCode: taxDetails?.postalCode || '',
    country: taxDetails?.country || 'Lietuva',
    VIT: taxDetails?.VIT || '',
    licenseNumber: taxDetails?.licenseNumber || '',
    created: taxDetails?.created || Date.now(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (taxDetails) {
      setFormData({
        id: taxDetails.id,
        type: taxDetails.type,
        name: taxDetails.name,
        adress: taxDetails.adress,
        companyCode: taxDetails.companyCode,
        city: taxDetails.city,
        postalCode: taxDetails.postalCode,
        country: taxDetails.country,
        VIT: taxDetails.VIT || '',
        licenseNumber: taxDetails.licenseNumber,
        created: taxDetails.created,
      });
    }
  }, [taxDetails]);

  const handleInputChange = (field: keyof UserTaxDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      UserTaxDetailsSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          fieldErrors[field] = err.message;
        });
      }
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Prašome ištaisyti klaidas formoje');
      return;
    }

    setIsSaving(true);
    try {
      const agencyRef = doc(db, DatabaseTables.agencyPrivate, agencyId);
      
      const updatedTaxDetails: UserTaxDetails = {
        ...formData as UserTaxDetails,
        updated: Date.now(),
      };

      await updateDoc(agencyRef, {
        taxDetails: updatedTaxDetails,
        updated: serverTimestamp(),
      });

      setHasChanges(false);
      toast.success('Mokesčių duomenys sėkmingai išsaugoti');
    } catch (error) {
      console.error('Error saving tax details:', error);
      toast.error('Nepavyko išsaugoti mokesčių duomenų');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (
    field: keyof UserTaxDetails,
    label: string,
    required = true,
    placeholder = ''
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={field}
        value={(formData[field] as string) || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className={errors[field] ? 'border-destructive' : ''}
      />
      {errors[field] && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mokesčių duomenys</CardTitle>
        <CardDescription>
          Įveskite savo įmonės arba individualios veiklos mokesčių informaciją
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selection */}
        <div className="space-y-3">
          <Label>
            Mokesčių mokėtojo tipas <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="company" id="company" />
              <Label htmlFor="company" className="font-normal cursor-pointer">
                Įmonė (UAB, MB, IĮ ir kt.)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="writer" id="writer" />
              <Label htmlFor="writer" className="font-normal cursor-pointer">
                Individualus rašytojas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="font-normal cursor-pointer">
                Kita
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField(
            'name',
            formData.type === 'company' ? 'Įmonės pavadinimas' : 'Vardas Pavardė',
            true,
            formData.type === 'company' ? 'UAB "Pavyzdys"' : 'Jonas Jonaitis'
          )}
          {renderField('companyCode', 'Įmonės/asmens kodas', true, '123456789')}
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          {renderField('adress', 'Adresas', true, 'Gedimino pr. 1')}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderField('city', 'Miestas', true, 'Vilnius')}
            {renderField('postalCode', 'Pašto kodas', true, 'LT-01103')}
            {renderField('country', 'Šalis', true, 'Lietuva')}
          </div>
        </div>

        {/* VAT Information */}
        {formData.type === 'company' && (
          <div className="space-y-2">
            <Label htmlFor="VIT">
              PVM mokėtojo kodas (VIT)
              <span className="text-muted-foreground ml-1">(neprivaloma)</span>
            </Label>
            <Input
              id="VIT"
              value={formData.VIT || ''}
              onChange={(e) => handleInputChange('VIT', e.target.value)}
              placeholder="LT123456789"
            />
            <p className="text-xs text-muted-foreground">
              Nurodykite tik jei esate PVM mokėtojas
            </p>
          </div>
        )}

        {/* License Number for Writers */}
        {formData.type === 'writer' && (
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">
              Individualios veiklos pažymėjimo numeris
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber || ''}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              placeholder="123456"
              className={errors.licenseNumber ? 'border-destructive' : ''}
            />
            {errors.licenseNumber && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.licenseNumber}
              </p>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>Yra neišsaugotų pakeitimų</span>
              </>
            ) : taxDetails ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Visos pakeitimai išsaugoti</span>
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
                Saugoma...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Išsaugoti
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
