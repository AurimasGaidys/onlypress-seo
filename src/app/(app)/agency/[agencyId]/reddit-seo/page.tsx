import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  MessageCircle, 
  Search, 
  Target, 
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  Bot,
  BarChart3,
  Lightbulb,
  Shield,
  Rocket
} from 'lucide-react';

export default function RedditSeoPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Reddit AI Agent</h1>
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            Coming Soon
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Know exactly when, where and what to say on Reddit to increase your brand visibility.
        </p>
      </div>

      {/* Main Hero Card */}
      <Card className="mb-12 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Bot className="h-16 w-16 text-orange-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Reddit AI Agent Is Coming Soon
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              LLMs regularly cite Reddit posts when giving answers. That's why we're building an AI Reddit agent that will help you identify the best Reddit communities and threads where you should engage to maximize your brand visibility and increase your chances of being cited by LLMs (ChatGPT, Perplexity, Claude and others).
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expected release: Q1 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              Smart Community Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              AI-powered identification of the most relevant Reddit communities for your brand and industry.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Real-time analysis of trending topics and conversations to find engagement opportunities.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              Content Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              AI-generated content suggestions that resonate with Reddit communities and drive engagement.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Search className="h-6 w-6 text-orange-600" />
              </div>
              LLM Citation Boost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Increase your chances of being cited by ChatGPT, Claude, and other AI models.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              Performance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed analytics on your Reddit engagement and brand visibility improvements.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              Brand Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Monitor mentions and protect your brand reputation across Reddit communities.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            How Reddit AI Agent Will Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Discover</h3>
              <p className="text-sm text-muted-foreground">
                AI scans Reddit to find the most relevant communities and trending discussions for your brand.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Analyze</h3>
              <p className="text-sm text-muted-foreground">
                Deep analysis of conversation context, sentiment, and engagement patterns.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Engage</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered recommendations on what to say, when, and where for maximum impact.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-blue-600" />
              Why Reddit SEO Matters in 2025
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Google's Reddit Partnership</p>
                <p className="text-sm text-muted-foreground">
                  Reddit content appears in "Discussions and forums" and AI Overviews
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Authentic User Intent</p>
                <p className="text-sm text-muted-foreground">
                  Access real conversations and genuine user feedback
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">LLM Training Data</p>
                <p className="text-sm text-muted-foreground">
                  Reddit content trains AI models - increase your citation chances
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              Expected Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Increased Brand Visibility</p>
                <p className="text-sm text-muted-foreground">
                  Show up in more Reddit discussions and Google SERPs
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Higher LLM Citations</p>
                <p className="text-sm text-muted-foreground">
                  Get mentioned by ChatGPT, Claude, and other AI models
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Authentic Engagement</p>
                <p className="text-sm text-muted-foreground">
                  Build genuine community relationships and trust
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Be the First to Know When We Launch
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join the waitlist and get early access to our Reddit AI Agent.
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
            Join Waitlist
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
