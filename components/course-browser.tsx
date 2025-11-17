import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Search, Star, Clock, Users, Plus, X, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { toast } from "sonner";
import { Course, mockCourses } from './course-data';

interface CourseBrowserProps {
  onCourseSelect: (course: Course) => void;
  calendarCourses?: Course[];
  onAddToCalendar?: (course: Course) => boolean;
  onRemoveFromCalendar?: (courseId: string) => void;
  favoritedCourses?: Course[];
  onToggleFavorite?: (course: Course) => void;
  allReviewsByCourse?: Record<string, any[]>;
}

export function CourseBrowser({ onCourseSelect, calendarCourses = [], onAddToCalendar, onRemoveFromCalendar, favoritedCourses = [], onToggleFavorite, allReviewsByCourse = {} }: CourseBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [prerequisiteFilter, setPrerequisiteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedCredits, setSelectedCredits] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('rating');

  const departments = Array.from(new Set(mockCourses.map(c => c.department))).sort();
  const creditOptions = [2, 3, 4];

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const toggleCredit = (credit: number) => {
    setSelectedCredits(prev => 
      prev.includes(credit) ? prev.filter(c => c !== credit) : [...prev, credit]
    );
  };

  const clearFilters = () => {
    setSelectedDepartments([]);
    setMinRating(0);
    setMaxWorkload(5);
    setPrerequisiteFilter('all');
    setSelectedCredits([]);
  };

  // Calculate averages from reviews for a course
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  };

  // Get course rating, review count, and workload from reviews
  const getCourseStats = (course: Course) => {
    const reviews = allReviewsByCourse[course.id] || [];
    
    if (reviews.length === 0) {
      return {
        rating: course.rating,
        reviewCount: course.reviewCount,
        workload: course.workload
      };
    }
    
    const avgDifficulty = calculateAverage(reviews.map(r => r.difficulty));
    const avgWorkload = calculateAverage(reviews.map(r => r.workload));
    const avgLearningGain = calculateAverage(reviews.map(r => r.learningGain));
    const overallRating = (avgDifficulty + avgWorkload + avgLearningGain) / 3;
    
    return {
      rating: overallRating,
      reviewCount: reviews.length,
      workload: avgWorkload
    };
  };

  const filteredCourses = mockCourses
    .filter(course => {
      const stats = getCourseStats(course);
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (course.professors && course.professors.length > 0 
                             ? course.professors.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
                             : course.professor.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(course.department);
      const matchesRating = stats.rating >= minRating;
      const matchesWorkload = stats.workload <= maxWorkload;
      const matchesPrereq = prerequisiteFilter === 'all' || 
                           (prerequisiteFilter === 'yes' && course.prerequisites.length > 0) ||
                           (prerequisiteFilter === 'no' && course.prerequisites.length === 0);
      const matchesCredits = selectedCredits.length === 0 || selectedCredits.includes(course.credits);
      
      return matchesSearch && matchesDepartment && matchesRating && matchesWorkload && matchesPrereq && matchesCredits;
    })
    .sort((a, b) => {
      const statsA = getCourseStats(a);
      const statsB = getCourseStats(b);
      switch (sortBy) {
        case 'rating':
          return statsB.rating - statsA.rating;
        case 'difficulty':
          return a.difficulty - b.difficulty;
        case 'workload':
          return statsA.workload - statsB.workload;
        default:
          return 0;
      }
    });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isInCalendar = (courseId: string) => {
    return calendarCourses.some(c => c.id === courseId);
  };

  const isFavorited = (courseId: string) => {
    return favoritedCourses.some(c => c.id === courseId);
  };

  const handleToggleFavorite = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(course);
      const wasFavorited = isFavorited(course.id);
      if (wasFavorited) {
        toast.success(`Removed ${course.code} from favorites`);
      } else {
        toast.success(`Added ${course.code} to favorites!`);
      }
    }
  };

  const handleAddToCalendar = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCalendar) {
      const wasAdded = onAddToCalendar(course);
      if (wasAdded) {
        toast.success(`Added ${course.code} to your calendar!`);
      } else {
        toast.info(`${course.code} is already in your calendar`);
      }
    }
  };

  const handleRemoveFromCalendar = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromCalendar) {
      onRemoveFromCalendar(course.id);
      toast.success(`Removed ${course.code} from your calendar`);
    }
  };

  const activeFiltersCount = selectedDepartments.length + 
    (minRating > 0 ? 1 : 0) + 
    (maxWorkload < 5 ? 1 : 0) + 
    (prerequisiteFilter !== 'all' ? 1 : 0) + 
    selectedCredits.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl">Browse Courses</h1>
        <p className="text-muted-foreground">
          Discover courses, read reviews, and plan your perfect schedule
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-64 flex-shrink-0">
          <Card className="sticky top-20 border-2" style={{ borderColor: '#FFCC00' }}>
            <CardHeader className="pb-4" style={{ backgroundColor: 'rgba(153, 0, 0, 0.05)' }}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold" style={{ color: '#990000' }}>
                  🔍 Filters
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-xs"
                    style={{ color: '#990000', border: '1px solid #FFCC00' }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <CardDescription className="text-sm font-medium" style={{ color: '#990000' }}>
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* School/Department */}
              <div>
                <Label className="mb-3 block font-semibold" style={{ color: '#990000' }}>
                  School/Department
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept}
                        checked={selectedDepartments.includes(dept)}
                        onCheckedChange={() => toggleDepartment(dept)}
                      />
                      <label
                        htmlFor={dept}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Rating */}
              <div>
                <Label className="mb-3 block font-semibold" style={{ color: '#990000' }}>
                  Minimum Rating
                </Label>
                <div className="space-y-3">
                  <div className="px-2">
                    <Slider
                      value={[minRating]}
                      onValueChange={([value]) => setMinRating(value)}
                      max={5}
                      step={0.5}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Any</span>
                    <span className="font-medium text-primary">{minRating.toFixed(1)}★</span>
                    <span>5.0★</span>
                  </div>
                </div>
              </div>

              {/* Workload */}
              <div>
                <Label className="mb-3 block font-semibold" style={{ color: '#990000' }}>
                  Maximum Workload
                </Label>
                <div className="space-y-3">
                  <div className="px-2">
                    <Slider
                      value={[maxWorkload]}
                      onValueChange={([value]) => setMaxWorkload(value)}
                      max={5}
                      min={1}
                      step={0.5}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Light</span>
                    <span className="font-medium text-primary">{maxWorkload.toFixed(1)}/5</span>
                    <span>Heavy</span>
                  </div>
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <Label className="mb-3 block font-semibold" style={{ color: '#990000' }}>
                  Prerequisites
                </Label>
                <Select value={prerequisiteFilter} onValueChange={(value: any) => setPrerequisiteFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="yes">Has Prerequisites</SelectItem>
                    <SelectItem value="no">No Prerequisites</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credits */}
              <div>
                <Label className="mb-3 block font-semibold" style={{ color: '#990000' }}>
                  Credits
                </Label>
                <div className="space-y-2">
                  {creditOptions.map(credit => (
                    <div key={credit} className="flex items-center space-x-2">
                      <Checkbox
                        id={`credit-${credit}`}
                        checked={selectedCredits.includes(credit)}
                        onCheckedChange={() => toggleCredit(credit)}
                      />
                      <label
                        htmlFor={`credit-${credit}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {credit} credits
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Course List */}
        <div className="flex-1">
          {/* Search and Sort */}
          <div className="bg-white rounded-lg border-2 p-4 mb-6" style={{ borderColor: '#FFCC00' }}>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses, professors, or course codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="difficulty">Easiest First</SelectItem>
                  <SelectItem value="workload">Lightest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {mockCourses.length} courses
          </div>

          {/* Course Grid */}
          <div className="grid gap-4">
            {filteredCourses.map((course) => {
              const stats = getCourseStats(course);
              return (
                <Card 
                  key={course.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onCourseSelect(course)}
                >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg">{course.code}</h3>
                        <Badge variant="secondary">{course.credits} credits</Badge>
                        {isInCalendar(course.id) && (
                          <Badge variant="outline" className="border-[#990000] text-[#990000]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            In Calendar
                          </Badge>
                        )}
                      </div>
                      <h4 className="mb-2">{course.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {course.professors && course.professors.length > 0 
                          ? (course.professors.length > 1 
                              ? `${course.professors.join(', ')} • ${course.department}`
                              : `${course.professors[0]} • ${course.department}`)
                          : `${course.professor} • ${course.department}`}
                      </p>
                      {course.schedules && course.schedules.length > 1 && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {course.schedules.length} timeslots available
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Star className={`h-5 w-5 ${getRatingColor(stats.rating)}`} />
                      <span className={`font-medium ${getRatingColor(stats.rating)}`}>
                        {stats.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{course.schedules && course.schedules.length > 0 
                        ? (course.schedules.length > 1 
                            ? `${course.schedules.length} timeslots`
                            : course.schedules[0])
                        : course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{stats.reviewCount} reviews</span>
                    </div>
                    <div>
                      Workload: {stats.workload.toFixed(1)}/5
                    </div>
                  </div>

                  {/* Prerequisites Badge */}
                  {course.prerequisites.length > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-muted-foreground">
                        Prerequisites: {course.prerequisites.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleFavorite(course, e)}
                      className={isFavorited(course.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
                    >
                      <Heart className={`h-4 w-4 ${isFavorited(course.id) ? 'fill-current' : ''}`} />
                    </Button>
                    {isInCalendar(course.id) ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => handleRemoveFromCalendar(course, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove from Calendar
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => handleAddToCalendar(course, e)}
                        style={{ backgroundColor: '#990000', color: 'white', borderColor: '#990000' }}
                        className="hover:opacity-90"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Calendar
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search criteria</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}