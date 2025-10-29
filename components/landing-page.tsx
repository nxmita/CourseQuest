import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BookOpen, Calendar, Star } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="mb-4">
              <span className="block text-6xl sm:text-7xl lg:text-8xl tracking-tight" style={{ color: '#990000' }}>
                CourseQuest
              </span>
            </h1>
            <p className="text-2xl sm:text-3xl mb-2" style={{ color: '#FFCC00', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
              Fight On for Course Planning!
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-6">
              Navigate USC's course catalog with confidence. Get authentic student reviews, 
              access syllabus archives, and build your perfect schedule with intelligent planning tools.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              style={{ backgroundColor: '#990000', color: 'white' }}
              className="px-12 py-6 text-lg hover:opacity-90"
            >
              <Calendar className="mr-2 h-6 w-6" />
              Start Planning
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-12 py-6 text-lg"
              onClick={onGetStarted}
              style={{ borderColor: '#990000', color: '#990000' }}
            >
              <BookOpen className="mr-2 h-6 w-6" />
              Browse Courses
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" style={{ backgroundColor: '#FFCC00', color: '#000' }}>5,200+</Badge>
              <span>USC Course Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" style={{ backgroundColor: '#FFCC00', color: '#000' }}>850+</Badge>
              <span>Professors Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" style={{ backgroundColor: '#FFCC00', color: '#000' }}>25,000+</Badge>
              <span>Trojans Helped</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl mb-4">
              Everything you need to plan your perfect semester
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From course discovery to schedule optimization, we've got your back
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(153, 0, 0, 0.1)' }}>
                  <BookOpen className="h-6 w-6" style={{ color: '#990000' }} />
                </div>
                <CardTitle>Real Course Intel</CardTitle>
                <CardDescription>
                  Get the inside scoop with student reviews, syllabi, and professor ratings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Detailed course reviews</li>
                  <li>• Syllabus archives</li>
                  <li>• Workload expectations</li>
                  <li>• Professor comparisons</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255, 204, 0, 0.2)' }}>
                  <Calendar className="h-6 w-6" style={{ color: '#990000' }} />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Visual calendar planning with conflict detection and optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Interactive calendar view</li>
                  <li>• Time slot finder</li>
                  <li>• Credit tracking</li>
                  <li>• Conflict detection</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(153, 0, 0, 0.1)' }}>
                  <Star className="h-6 w-6" style={{ color: '#FFCC00' }} />
                </div>
                <CardTitle>Community Reviews</CardTitle>
                <CardDescription>
                  Rate courses on difficulty, workload, and learning gain to help others
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Difficulty ratings</li>
                  <li>• Workload assessments</li>
                  <li>• Learning gain scores</li>
                  <li>• Anonymous reviews</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl mb-4">
            Ready to take control of your schedule?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of USC students who've already optimized their course planning with CourseQuest
          </p>
          <Button 
            size="lg" 
            onClick={onGetStarted}
            style={{ backgroundColor: '#990000', color: 'white' }}
            className="px-8 py-3 hover:opacity-90"
          >
            Get Started for Free
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Sign in to save your selected and favorited courses for next time.
          </p>
        </div>
      </section>
    </div>
  );
}