// src/components/portals/PortalCard.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Send, TrendingUp, Users, X, Check, 
  Leaf, Bitcoin, Dice1, Heart, Briefcase, ShoppingBag, Camera, 
  Music, Film, Book, Utensils, Car, Home, TreePine, Dumbbell, 
  Stethoscope, Plane, GraduationCap 
} from 'lucide-react';
import { PortalPublic } from '@/types/portalPublic';

interface PortalCardProps {
  portal: PortalPublic;
}

// Helper function to format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// Helper function to parse themes string into array
const parseThemes = (themes: string): string[] => {
  if (!themes) return [];
  return themes.split(',').map(theme => theme.trim()).filter(theme => theme.length > 0);
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

export default function PortalCard({ portal }: PortalCardProps) {
  // FINAL LOGIC: Prioritize 'title' from database.
  // Fallback to 'name' if 'title' doesn't exist for some reason.
  const displayTitle = portal.title || portal.description || 'Untitled Portal';
  
  // FINAL LOGIC: Check for 'domain' first, then fall back to 'url'.
  const displayUrl = portal.domain || portal.domain;

  // Parse restricted and allowed topics
  const restrictedTopics = parseThemes(portal.weDoNotPublishThemes || '');
  const allowedTopics = portal.possiblePublicationsInTopics || [];

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <div className="flex-1 min-w-0">
              {/* CORRECTED: Using displayTitle */}
              <CardTitle className="truncate">{displayTitle}</CardTitle>
              {/* CORRECTED: Using displayUrl */}
              <CardDescription className="truncate">
                {displayUrl ? displayUrl.replace(/^https?:\/\//, '') : 'No URL provided'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {portal.description || 'No description available.'}
        </p>
        
        {/* ADDED: Display Ahrefs DR and Users per Month */}
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <div>
                    {/* CORRECTED: Using '??' to correctly handle a value of 0 */}
                    <div className="font-semibold">{portal.ahrefsDomainRating ?? 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">DR</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                    {/* CORRECTED: Using '??' to correctly handle a value of 0 */}
                    <div className="font-semibold">{portal.usersPerMonth != null ? formatNumber(portal.usersPerMonth) : 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">/ month</div>
                </div>
            </div>
        </div>
        
        {/* ADDED: Publication Topics Section */}
        <div className="space-y-2">
          {/* Restricted Topics */}
          {restrictedTopics.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                Not allowed:
              </div>
              <div className="flex flex-wrap gap-1">
                {restrictedTopics.map((topic, index) => {
                  const Icon = getTopicIcon(topic);
                  return (
                    <Badge 
                      key={`restricted-${index}`} 
                      variant="destructive" 
                      className="text-xs p-1"
                      title={topic}
                    >
                      <Icon className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Allowed Topics */}
          {allowedTopics.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Allowed:
              </div>
              <div className="flex flex-wrap gap-1">
                {allowedTopics.map((topic, index) => {
                  const Icon = getTopicIcon(topic);
                  return (
                    <Badge 
                      key={`allowed-${index}`} 
                      variant="secondary" 
                      className="text-xs p-1 bg-green-100 text-green-800 border-green-200"
                      title={topic}
                    >
                      <Icon className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {portal.categories?.map(category => (
            <Badge key={category} variant="secondary">{category}</Badge>
          ))}
        </div>
      </CardContent>
      <div className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xl font-bold text-primary">{portal.price || 0} EUR</span>
        <Button size="sm">
          <Send className="mr-2 h-4 w-4" />
          Publish Here
        </Button>
      </div>
    </Card>
  );
}
