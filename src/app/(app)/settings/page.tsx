'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMe } from '@/context/MeContext/MeContext';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const { userPrivate } = useMe();

  const handleMenuVersionChange = async (value: 'menu1' | 'menu2') => {
    if (!user) return;

    try {
      const userPrivateRef = doc(db, 'users-private', user.uid);
      await updateDoc(userPrivateRef, {
        menuVersion: value,
      });
      toast.success('Menu version updated successfully');
    } catch (error) {
      console.error('Error updating menu version:', error);
      toast.error('Failed to update menu version');
    }
  };

  const currentMenuVersion = userPrivate?.menuVersion || 'menu1';

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="p-2">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">Choose between light and dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="border-t pt-6">
                  <div className="space--3">
                    <div>
                      <p className="font-medium">Editor Menu Style</p>
                      <p className="text-sm text-muted-foreground">Choose the style of editor menu tabs</p>
                    </div>
                    <RadioGroup value={currentMenuVersion} onValueChange={handleMenuVersionChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="menu1" id="menu1" />
                        <Label htmlFor="menu1" className="cursor-pointer">
                          <div>
                            <p className="font-medium">Wizard Menu</p>
                            <p className="text-sm text-muted-foreground">Best for getting started</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="menu2" id="menu2" />
                        <Label htmlFor="menu2" className="cursor-pointer">
                          <div>
                            <p className="font-medium">Modern Menu</p>
                            <p className="text-sm text-muted-foreground">Larger tabs with gradient background</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="menu0" id="menu1" />
                        <Label htmlFor="menu1" className="cursor-pointer">
                          <div>
                            <p className="font-medium">Classic Menu</p>
                            <p className="text-sm text-muted-foreground">Compact tabs with border indicator</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground mt-6">V 1.14</p>
        </div>
      </div>
    </>
  );
}
