// src/components/editor/PublishModal.tsx
'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, Send, Globe, TrendingUp, Users,
  Leaf, Bitcoin, Dice1, Heart, Briefcase, ShoppingBag, Camera,
  Music, Film, Book, Utensils, Car, Home, TreePine, Dumbbell,
  Stethoscope, Plane, GraduationCap
} from 'lucide-react';
import { usePortals } from '@/hooks/usePortals';
import { toast } from 'sonner';
import { ArticleDocument } from '@/types/document';
import { ApiBuyerOrderCreate } from '@/context/api';
import { PublishOrder } from '@/types/publishOrder';
import { useMe } from '@/context/MeContext/MeContext';
import { useWorkspace } from '@/context/WorkspaceContext';

interface PublishModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  document: ArticleDocument;
}

// Helper function to format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// Function to get icon for topic category
const getTopicIcon = (topic: string) => {
  const normalizedTopic = topic.toLowerCase().trim();

  // Map topics to icons
  if (normalizedTopic.includes('cbd') || normalizedTopic.includes('pharmacy') || normalizedTopic.includes('dietary')) {
    return Leaf;
  }
  if (normalizedTopic.includes('cryptocurrency') || normalizedTopic.includes('crypto')) {
    return Bitcoin;
  }
  if (normalizedTopic.includes('gambling') || normalizedTopic.includes('casino')) {
    return Dice1;
  }
  if (normalizedTopic.includes('adult') || normalizedTopic.includes('dating')) {
    return Heart;
  }
  if (normalizedTopic.includes('loan') || normalizedTopic.includes('finance')) {
    return Briefcase;
  }
  if (normalizedTopic.includes('shopping') || normalizedTopic.includes('retail')) {
    return ShoppingBag;
  }
  if (normalizedTopic.includes('photo') || normalizedTopic.includes('camera')) {
    return Camera;
  }
  if (normalizedTopic.includes('music') || normalizedTopic.includes('audio')) {
    return Music;
  }
  if (normalizedTopic.includes('film') || normalizedTopic.includes('movie') || normalizedTopic.includes('video')) {
    return Film;
  }
  if (normalizedTopic.includes('book') || normalizedTopic.includes('reading')) {
    return Book;
  }
  if (normalizedTopic.includes('food') || normalizedTopic.includes('restaurant')) {
    return Utensils;
  }
  if (normalizedTopic.includes('car') || normalizedTopic.includes('auto')) {
    return Car;
  }
  if (normalizedTopic.includes('home') || normalizedTopic.includes('real estate')) {
    return Home;
  }
  if (normalizedTopic.includes('nature') || normalizedTopic.includes('environment')) {
    return TreePine;
  }
  if (normalizedTopic.includes('fitness') || normalizedTopic.includes('gym')) {
    return Dumbbell;
  }
  if (normalizedTopic.includes('health') || normalizedTopic.includes('medical')) {
    return Stethoscope;
  }
  if (normalizedTopic.includes('travel') || normalizedTopic.includes('vacation')) {
    return Plane;
  }
  if (normalizedTopic.includes('education') || normalizedTopic.includes('school')) {
    return GraduationCap;
  }

  // Default icon
  return Briefcase;
};

export default function PublishModal({ isOpen, setIsOpen, document }: PublishModalProps) {
  const { portals, loading, error } = usePortals();
  const [selectedPortalIds, setSelectedPortalIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const { userPrivate } = useMe();
  const { activeWorkspace } = useWorkspace();

  const handleSelectPortal = (portalId: string) => {
    setSelectedPortalIds(prev =>
      prev.includes(portalId)
        ? prev.filter(id => id !== portalId)
        : [...prev, portalId]
    );
  };

  const totalPrice = useMemo(() => {
    return selectedPortalIds.reduce((total, portalId) => {
      const portal = portals.find(p => p.id === portalId);
      return total + (portal?.price || 0);
    }, 0);
  }, [selectedPortalIds, portals]);

  const handlePublish = async () => {
    setIsPublishing(true);
    alert("Publishing started");
    console.log("Publishing to portals:2", document);

    //qqqq add actual publishing logic here
    const order: PublishOrder = {
      id: "new-test",
      status: "Created",
      publishers: selectedPortalIds || [],
      prices: [], // prices for each publisher
      publishDate: Date.now(),
      dateToPublish: Date.now(), // TODO add when to publish when to publish, if not set, then publish immediately
      price: 0,

      publisherCategories: [], // text category id
      textInfo: {
        title: document.title,
        content: document.content,
        seo: {
          featuredImage: document.metadata?.featuredImage || "",
          title: document.metadata?.seoTitle || "",
          description: document.metadata?.seoDescription || "",
        }
      },

      publishTasks: [],

      buyerId: userPrivate?.id || "error-no-userid",
      paymentId: "",

      dateCreated: Date.now(),
      dateUpdated: Date.now(),
      offsetInMinutes: Date.now(),
      createPublicReloease: false
    };

    try {
      const data = await ApiBuyerOrderCreate({
        order,
        payCredit: true,
        agencyId: activeWorkspace?.id || 'personal',
      });

      console.log("Order created:", data);
      toast.success("Order created successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order.");
    };

    // // Placeholder for future API call
    // await new Promise(resolve => setTimeout(resolve, 1500));
    // toast.info("Publication Feature Coming Soon", {
    //   description: `You are about to publish "${document.title}" to ${selectedPortalIds.length} portal(s) for a total of ${totalPrice.toFixed(2)} EUR. This functionality is under development.`,
    // });
    setIsPublishing(false);
    // setIsOpen(false); // We can enable this later
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[70vw] sm:w-[70vw] md:w-[70vw] lg:w-[70vw] xl:w-[70vw] max-w-[70vw] !max-w-none h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Publish Document</DialogTitle>
          <DialogDescription>
            Select the portals where you want to publish your article: &ldquo;{document.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto border-y -mx-6 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-destructive text-center">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] min-w-[50px]"></TableHead>
                    <TableHead className="min-w-[150px]">Portal</TableHead>
                    <TableHead className="text-center min-w-[80px]">DR</TableHead>
                    <TableHead className="text-center min-w-[100px]">Visitors</TableHead>
                    <TableHead className="text-center min-w-[120px]">Leidžiamos temos</TableHead>
                    <TableHead className="text-right min-w-[100px]">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portals.map(portal => (
                    <TableRow
                      key={portal.id}
                      onClick={() => handleSelectPortal(portal.id)}
                      className="cursor-pointer"
                      data-state={selectedPortalIds.includes(portal.id) ? 'selected' : ''}
                    >
                      <TableCell className="p-2">
                        <Checkbox
                          checked={selectedPortalIds.includes(portal.id)}
                          onCheckedChange={() => handleSelectPortal(portal.id)}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="font-medium truncate">{portal.title || portal.domain}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{portal.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm">{portal.ahrefsDomainRating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{formatNumber(portal.usersPerMonth)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {portal.possiblePublicationsInTopics?.slice(0, 3).map((topic, index) => {
                            const Icon = getTopicIcon(topic);
                            return (
                              <div
                                key={index}
                                className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                                title={topic}
                              >
                                <Icon className="h-3 w-3" />
                              </div>
                            );
                          })}
                          {portal.possiblePublicationsInTopics && portal.possiblePublicationsInTopics.length > 3 && (
                            <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                              +{portal.possiblePublicationsInTopics.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2 font-semibold whitespace-nowrap">{portal.price.toFixed(2)} EUR</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-muted-foreground">
              {selectedPortalIds.length} portal(s) selected
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-lg">{totalPrice.toFixed(2)} EUR</p>
                <p className="text-xs text-muted-foreground">Total Price</p>
              </div>
              <Button
                size="lg"
                onClick={handlePublish}
                disabled={isPublishing || selectedPortalIds.length === 0}
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Pay & Publish
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
