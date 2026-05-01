import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Link, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Shield, 
  Target,
  ArrowUp,
  ArrowDown,
  Zap
} from 'lucide-react';

export default function BacklinksPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Link className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Backlink Exchange</h1>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Coming Soon
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Build your domain authority through intelligent backlink exchange with complementary websites.
        </p>
      </div>

      {/* How It Works Section */}
      <Card className="mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">How it works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">What are backlinks?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Backlinks are links from other websites that point to your website. They act as "votes of confidence" from other sites, telling search engines that your content is valuable and trustworthy.
                </p>
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                  <p className="text-sm font-medium">Example:</p>
                  <p className="text-sm text-muted-foreground">
                    If a popular tech blog links to your article about web development, that's a valuable backlink that improves your search rankings.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">Why do I need backlinks?</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Backlinks are one of the most important ranking factors for search engines. They help you:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Improve search rankings</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Increase domain authority</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Drive referral traffic</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Build credibility</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">How will the backlink exchange work?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our automated backlink exchange system works by connecting websites with complementary content and facilitating mutual backlink placement.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Intelligent Matching</h4>
                <p className="text-sm text-muted-foreground">
                  Our algorithm analyzes your content and matches you with relevant websites in complementary niches.
                </p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Automatic Placement</h4>
                <p className="text-sm text-muted-foreground">
                  Relevant backlinks are automatically placed in your articles, and your articles receive backlinks from partner sites.
                </p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Quality Control</h4>
                <p className="text-sm text-muted-foreground">
                  All backlinks are reviewed for relevance and quality to ensure they provide value to your readers.
                </p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2">Win-Win Exchange</h4>
                <p className="text-sm text-muted-foreground">
                  You'll gain high-quality backlinks for your content while providing contextually relevant links to other quality websites, creating a mutually beneficial network.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ArrowDown className="h-6 w-6 text-green-600" />
              Backlinks Received
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">High-quality links earned</div>
              <p className="text-muted-foreground mb-4">
                All received/given backlinks will be shown here
              </p>
              <div className="bg-white rounded-lg p-6 border border-green-100">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">Total: 0</p>
                    <p className="text-sm text-muted-foreground">Backlinks Received</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Backlinks Received</p>
                    <p className="text-muted-foreground">Total: 0</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Backlinks coming soon once new articles are generated across our network
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ArrowUp className="h-6 w-6 text-blue-600" />
              Backlinks Given
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">Links provided to network</div>
              <p className="text-muted-foreground mb-4">
                Estimated value of received backlinks
              </p>
              <div className="bg-white rounded-lg p-6 border border-blue-100">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">Total: 0</p>
                    <p className="text-sm text-muted-foreground">Backlinks Given</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Backlinks Given</p>
                    <p className="text-muted-foreground">Total: 0</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 inline mr-2" />
                Backlinks coming soon once new articles are generated across our network
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Value Card */}
      <Card className="mb-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Total Value Received</h2>
            <div className="text-5xl font-bold mb-4">$0</div>
            <p className="text-lg opacity-90">
              Estimated value of received backlinks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Process Flow */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Backlinks Exchange Process</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Finding Opportunities</h3>
              <p className="text-muted-foreground">
                As we generate new articles, we will naturally include 1-2 links to other relevant websites in our network within content.
              </p>
              <div className="mt-4">
                <Badge variant="secondary" className="text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Finding Opportunities
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">You are doing everything right ✨</h3>
              <p className="text-muted-foreground">
                Backlinks Given and Received stats will update automatically as we build the network.
              </p>
              <div className="mt-4">
                <Badge className="bg-green-100 text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Everything Ready
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-lg font-semibold text-muted-foreground">
          <Badge className="bg-blue-100 text-blue-800">
            Coming Soon
          </Badge>
          <span>Once new articles are generated across our network, we will identify opportunities to receive backlinks from other relevant websites.</span>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Be First to Access Our Backlink Network
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join the waitlist and get early access to intelligent backlink exchange.
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
            Join Waitlist
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
