import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Course, mockCourses } from '../course-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from './ui/pagination';

interface CourseBrowserProps {
  onCourseSelect: (course: Course) => void;
  calendarCourses?: Course[];
  onAddToCalendar?: (course: Course, selectedSchedule?: string) => boolean;
  onRemoveFromCalendar?: (courseId: string) => void;
  onReplaceCourse?: (oldCourseId: string, newCourse: Course, selectedSchedule?: string) => void;
  favoritedCourses?: Course[];
  onToggleFavorite?: (course: Course) => void;
  allReviewsByCourse?: Record<string, any[]>;
  courseSelectedSchedules?: Record<string, string>;
}

// Helper function to parse schedule (copied from calendar-view.tsx)
const parseSchedule = (schedule: string) => {
  if (!schedule || typeof schedule !== 'string' || schedule === 'TBA' || schedule.includes('TBA')) {
    return [];
  }
  
  const scheduleSlots: Array<{ day: string; startTime: string; endTime: string }> = [];
  
  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.replace(/(\d{1,2}):(\d{2})\s?(AM|PM)/i, (match, hour, minute, period) => {
      const hourNum = parseInt(hour, 10);
      return `${hourNum}:${minute} ${period.toUpperCase()}`;
    });
  };

  const timeRangeMatch = schedule.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s?(AM|PM)/i);
  let startTime = '';
  let endTime = '';
  
  if (timeRangeMatch) {
    const [, startTimeStr, endTimeStr, period] = timeRangeMatch;
    startTime = normalizeTime(`${startTimeStr} ${period}`);
    endTime = normalizeTime(`${endTimeStr} ${period}`);
  } else {
    const timeMatches = schedule.match(/(\d{1,2}:\d{2}\s?(?:AM|PM))/gi);
    startTime = timeMatches && timeMatches[0] ? normalizeTime(timeMatches[0]) : '';
    endTime = timeMatches && timeMatches[1] ? normalizeTime(timeMatches[1]) : '';
  }
  
  const dayMap: { [key: string]: string[] } = {
    'MWF': ['Monday', 'Wednesday', 'Friday'],
    'TTh': ['Tuesday', 'Thursday'],
    'TuTh': ['Tuesday', 'Thursday'],
    'MW': ['Monday', 'Wednesday'],
    'M': ['Monday'],
    'T': ['Tuesday'],
    'W': ['Wednesday'],
    'Th': ['Thursday'],
    'F': ['Friday']
  };
  
  if (schedule.includes('MWF')) {
    dayMap['MWF'].forEach(day => {
      scheduleSlots.push({ day, startTime, endTime });
    });
  } else if (schedule.includes('TTh') || schedule.includes('TuTh')) {
    dayMap['TTh'].forEach(day => {
      scheduleSlots.push({ day, startTime, endTime });
    });
  } else if (schedule.includes('MW')) {
    dayMap['MW'].forEach(day => {
      scheduleSlots.push({ day, startTime, endTime });
    });
  } else {
    if (schedule.includes(' M ') || schedule.startsWith('M ') || schedule.includes(' M')) {
      dayMap['M'].forEach(day => {
        scheduleSlots.push({ day, startTime, endTime });
      });
    }
    if (schedule.includes(' T ') || schedule.startsWith('T ') || (schedule.includes(' T') && !schedule.includes('Th'))) {
      dayMap['T'].forEach(day => {
        scheduleSlots.push({ day, startTime, endTime });
      });
    }
    if (schedule.includes(' W ') || schedule.startsWith('W ') || schedule.includes(' W')) {
      dayMap['W'].forEach(day => {
        scheduleSlots.push({ day, startTime, endTime });
      });
    }
    if (schedule.includes('Th ') || schedule.includes(' Th')) {
      dayMap['Th'].forEach(day => {
        scheduleSlots.push({ day, startTime, endTime });
      });
    }
    if (schedule.includes(' F ') || schedule.startsWith('F ') || schedule.includes(' F')) {
      dayMap['F'].forEach(day => {
        scheduleSlots.push({ day, startTime, endTime });
      });
    }
  }
  
  return scheduleSlots;
};

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  try {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    return hour24 * 60 + minutes;
  } catch (error) {
    return 0;
  }
};

const calculateEndTime = (startTime: string): string => {
  try {
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    const endMinutes = minutes + 50;
    const endHour24 = hour24 + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    const endHour12 = endHour24 > 12 ? endHour24 - 12 : endHour24 === 0 ? 12 : endHour24;
    const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
    return `${endHour12}:${finalMinutes.toString().padStart(2, '0')} ${endPeriod}`;
  } catch (error) {
    return '11:50 AM';
  }
};

const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1 || calculateEndTime(start1));
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2 || calculateEndTime(start2));
  return start1Min < end2Min && start2Min < end1Min;
};

export function CourseBrowser({ onCourseSelect, calendarCourses = [], onAddToCalendar, onRemoveFromCalendar, onReplaceCourse, favoritedCourses = [], onToggleFavorite, allReviewsByCourse = {}, courseSelectedSchedules = {} }: CourseBrowserProps) {
  const [timeslotDialogOpen, setTimeslotDialogOpen] = useState(false);
  const [selectedCourseForTimeslot, setSelectedCourseForTimeslot] = useState<Course | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictCourse, setConflictCourse] = useState<Course | null>(null);
  const [conflictNewCourse, setConflictNewCourse] = useState<Course | null>(null);
  const [conflictSelectedSchedule, setConflictSelectedSchedule] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [prerequisiteFilter, setPrerequisiteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedCredits, setSelectedCredits] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const departments = Array.from(new Set(mockCourses.map(c => c.department))).sort();
  const creditOptions = [2, 3, 4];

  const toggleDepartment = useCallback((dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  }, []);

  const toggleCredit = useCallback((credit: number) => {
    setSelectedCredits(prev => 
      prev.includes(credit) ? prev.filter(c => c !== credit) : [...prev, credit]
    );
  }, []);

  const handleMinRatingChange = useCallback((value: number) => {
    setMinRating(value);
  }, []);

  const handleMaxWorkloadChange = useCallback((value: number) => {
    setMaxWorkload(value);
  }, []);

  const handlePrerequisiteFilterChange = useCallback((value: 'all' | 'yes' | 'no') => {
    setPrerequisiteFilter(value);
  }, []);

  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedDepartments([]);
    setMinRating(0);
    setMaxWorkload(5);
    setPrerequisiteFilter('all');
    setSelectedCredits([]);
  }, []);

  // Calculate averages from reviews for a course
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  };

  // Get course rating, review count, and workload from reviews (memoized)
  const getCourseStats = useMemo(() => {
    const statsMap = new Map<string, { rating: number; reviewCount: number; workload: number }>();
    
    mockCourses.forEach(course => {
      const reviews = allReviewsByCourse[course.id] || [];
      
      if (reviews.length === 0) {
        statsMap.set(course.id, {
          rating: course.rating,
          reviewCount: course.reviewCount,
          workload: course.workload
        });
      } else {
        const avgDifficulty = calculateAverage(reviews.map(r => r.difficulty));
        const avgWorkload = calculateAverage(reviews.map(r => r.workload));
        const avgLearningGain = calculateAverage(reviews.map(r => r.learningGain));
        const overallRating = (avgDifficulty + avgWorkload + avgLearningGain) / 3;
        
        statsMap.set(course.id, {
          rating: overallRating,
          reviewCount: reviews.length,
          workload: avgWorkload
        });
      }
    });
    
    return (course: Course) => statsMap.get(course.id) || {
      rating: course.rating,
      reviewCount: course.reviewCount,
      workload: course.workload
    };
  }, [allReviewsByCourse]);

  // Check if any courses have ratings
  const hasAnyRatings = useMemo(() => {
    return Object.keys(allReviewsByCourse).some(courseId => {
      const reviews = allReviewsByCourse[courseId] || [];
      return reviews.length > 0;
    });
  }, [allReviewsByCourse]);

  // Helper function to normalize course code for search (remove hyphens)
  const normalizeCourseCode = (code: string): string => {
    return code.replace(/-/g, '').toLowerCase();
  };

  // Optimize filtered courses with useMemo - no debouncing needed, useMemo handles performance
  const filteredCourses = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const normalizedQuery = normalizeCourseCode(searchQuery);
    
    // Check if rating/workload filters are being used
    const ratingFiltersActive = minRating > 0 || maxWorkload < 5;
    
    // Check if no filters are applied (default state)
    const noFilters = minRating === 0 && maxWorkload === 5 && 
                     selectedDepartments.length === 0 && 
                     prerequisiteFilter === 'all' && 
                     selectedCredits.length === 0 && 
                     !lowerQuery;
    
    // First, filter by non-rating filters (search, department, prerequisites, credits)
    const baseFiltered = mockCourses.filter(course => {
      const matchesSearch = !lowerQuery || 
                         course.title.toLowerCase().includes(lowerQuery) ||
                         course.code.toLowerCase().includes(lowerQuery) ||
                         normalizeCourseCode(course.code).includes(normalizedQuery) ||
                         (course.professors && course.professors.length > 0 
                           ? course.professors.some(p => p.toLowerCase().includes(lowerQuery))
                           : course.professor.toLowerCase().includes(lowerQuery));
      const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(course.department);
      const matchesPrereq = prerequisiteFilter === 'all' || 
                           (prerequisiteFilter === 'yes' && course.prerequisites.length > 0) ||
                           (prerequisiteFilter === 'no' && course.prerequisites.length === 0);
      const matchesCredits = selectedCredits.length === 0 || selectedCredits.includes(course.credits);
      
      return matchesSearch && matchesDepartment && matchesPrereq && matchesCredits;
    });

    // If no rating filters are active, sort all courses alphabetically
    if (!ratingFiltersActive) {
      return baseFiltered.sort((a, b) => {
        if (noFilters) {
          // If no filters at all, sort alphabetically by code
          return a.code.localeCompare(b.code);
        }
        // If other filters are active but not rating/workload, use sortBy
        const statsA = getCourseStats(a);
        const statsB = getCourseStats(b);
        const reviewsA = allReviewsByCourse[a.id] || [];
        const reviewsB = allReviewsByCourse[b.id] || [];
        const hasRatingsA = reviewsA.length > 0;
        const hasRatingsB = reviewsB.length > 0;
        
        // If both have ratings or both don't, sort by selected criteria
        if (hasRatingsA === hasRatingsB) {
          switch (sortBy) {
            case 'rating':
              return statsB.rating - statsA.rating;
            case 'difficulty':
              return a.difficulty - b.difficulty;
            case 'workload':
              return statsA.workload - statsB.workload;
            default:
              return a.code.localeCompare(b.code); // Alphabetical by code
          }
        }
        // If only one has ratings, prioritize it
        return hasRatingsB ? 1 : -1;
      });
    }

    // Rating filters are active - separate courses with and without ratings
    const withRatings: Course[] = [];
    const withoutRatings: Course[] = [];
    
    baseFiltered.forEach(course => {
      const reviews = allReviewsByCourse[course.id] || [];
      const hasRatings = reviews.length > 0;
      
      if (hasRatings) {
        // Check if it matches the rating/workload filters
        const stats = getCourseStats(course);
        if (stats.rating >= minRating && stats.workload <= maxWorkload) {
          withRatings.push(course);
        }
      } else {
        // Course doesn't have ratings - always include it (will be shown after courses with ratings)
        withoutRatings.push(course);
      }
    });
    
    // Sort courses with ratings by selected sort criteria
    withRatings.sort((a, b) => {
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
          return a.code.localeCompare(b.code); // Alphabetical by code
      }
    });
    
    // Sort courses without ratings alphabetically by code
    withoutRatings.sort((a, b) => a.code.localeCompare(b.code));
    
    // Return courses with ratings first, then courses without ratings
    return [...withRatings, ...withoutRatings];
  }, [searchQuery, selectedDepartments, minRating, maxWorkload, prerequisiteFilter, selectedCredits, sortBy, getCourseStats, allReviewsByCourse]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartments, minRating, maxWorkload, prerequisiteFilter, selectedCredits, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Helper function to format prerequisites with course names
  const formatPrerequisite = (prereq: string): string => {
    // Handle complex patterns like "1 from (TAC-265 or ITP-265)" or "TAC-325 and TAC-375"
    // Pattern matches course codes: letters, dash, digits, optionally followed by a letter
    // Examples: ENGR-100A, TAC-265, ITP-265, CSCI-103, ACAD-275
    const courseCodePattern = /([A-Z]+-\d+[A-Z]?)/g;
    
    return prereq.replace(courseCodePattern, (match) => {
      const prereqCourse = mockCourses.find(c => c.code === match);
      return prereqCourse ? `${prereqCourse.code} - ${prereqCourse.title}` : match;
    });
  };

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

  // Check for conflicts between a schedule and existing calendar courses
  const checkScheduleConflict = (newSchedule: string, newCourse: Course): { hasConflict: boolean; conflictingCourse: Course | null } => {
    if (!calendarCourses || calendarCourses.length === 0) {
      return { hasConflict: false, conflictingCourse: null };
    }

    const newSlots = parseSchedule(newSchedule);
    
    for (const existingCourse of calendarCourses) {
      if (existingCourse.id === newCourse.id) {
        continue; // Skip the same course
      }

      // Get the selected schedule for existing course
      let existingSchedules: string[] = [];
      if (courseSelectedSchedules[existingCourse.id]) {
        existingSchedules = [courseSelectedSchedules[existingCourse.id]];
      } else {
        existingSchedules = (existingCourse.schedules && existingCourse.schedules.length > 0) 
          ? existingCourse.schedules 
          : (existingCourse.schedule ? [existingCourse.schedule] : []);
      }

      // Check if any slots conflict
      for (const existingSchedule of existingSchedules) {
        const existingSlots = parseSchedule(existingSchedule);
        
        for (const newSlot of newSlots) {
          if (!newSlot.day || !newSlot.startTime) continue;
          
          for (const existingSlot of existingSlots) {
            if (!existingSlot.day || !existingSlot.startTime) continue;
            
            if (newSlot.day === existingSlot.day) {
              const newEndTime = newSlot.endTime || calculateEndTime(newSlot.startTime);
              const existingEndTime = existingSlot.endTime || calculateEndTime(existingSlot.startTime);
              
              if (timesOverlap(
                newSlot.startTime,
                newEndTime,
                existingSlot.startTime,
                existingEndTime
              )) {
                return { hasConflict: true, conflictingCourse: existingCourse };
              }
            }
          }
        }
      }
    }
    
    return { hasConflict: false, conflictingCourse: null };
  };

  const handleAddToCalendar = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if course is already in calendar
    if (calendarCourses.some(c => c.id === course.id)) {
      toast.info(`${course.code} is already in your calendar`);
      return;
    }

    // Get available schedules for this course
    const availableSchedules = (course.schedules && course.schedules.length > 0) 
      ? course.schedules 
      : (course.schedule ? [course.schedule] : []);

    // If course has multiple schedules, show timeslot selection dialog
    if (availableSchedules.length > 1) {
      setSelectedCourseForTimeslot(course);
      setSelectedSchedule(availableSchedules[0]); // Default to first schedule
      setTimeslotDialogOpen(true);
      return;
    }

    // Single schedule - check for conflicts directly
    if (availableSchedules.length === 1) {
      const schedule = availableSchedules[0];
      const conflict = checkScheduleConflict(schedule, course);
      
      if (conflict.hasConflict && conflict.conflictingCourse) {
        // Show conflict dialog
        setConflictNewCourse(course);
        setConflictSelectedSchedule(schedule);
        setConflictCourse(conflict.conflictingCourse);
        setConflictDialogOpen(true);
        return;
      }
      
      // No conflict, add directly
      if (onAddToCalendar) {
        const wasAdded = onAddToCalendar(course, schedule);
        if (wasAdded) {
          toast.success(`Added ${course.code} to your calendar!`);
        }
      }
    }
  };

  const handleTimeslotConfirm = () => {
    if (!selectedCourseForTimeslot || !selectedSchedule) return;

    // Check for conflicts with the selected schedule
    const conflict = checkScheduleConflict(selectedSchedule, selectedCourseForTimeslot);
    
    if (conflict.hasConflict && conflict.conflictingCourse) {
      // Show conflict dialog
      setConflictNewCourse(selectedCourseForTimeslot);
      setConflictSelectedSchedule(selectedSchedule);
      setConflictCourse(conflict.conflictingCourse);
      setTimeslotDialogOpen(false);
      setConflictDialogOpen(true);
      return;
    }

    // No conflict, add the course
    if (onAddToCalendar) {
      const wasAdded = onAddToCalendar(selectedCourseForTimeslot, selectedSchedule);
      if (wasAdded) {
        toast.success(`Added ${selectedCourseForTimeslot.code} (${selectedSchedule}) to your calendar!`);
      }
    }
    
    setTimeslotDialogOpen(false);
    setSelectedCourseForTimeslot(null);
    setSelectedSchedule('');
  };

  const handleConflictConfirm = () => {
    if (!conflictNewCourse || !conflictSelectedSchedule || !conflictCourse) return;

    // Use atomic replace if available, otherwise remove then add
    if (onReplaceCourse) {
      onReplaceCourse(conflictCourse.id, conflictNewCourse, conflictSelectedSchedule);
      toast.success(`Replaced ${conflictCourse.code} with ${conflictNewCourse.code} in your calendar!`);
    } else if (onRemoveFromCalendar && onAddToCalendar) {
      // Fallback: remove then add (this should work with functional updates)
      onRemoveFromCalendar(conflictCourse.id);
      // Add the new course after removal completes
      setTimeout(() => {
        const wasAdded = onAddToCalendar(conflictNewCourse, conflictSelectedSchedule);
        if (wasAdded) {
          toast.success(`Replaced ${conflictCourse.code} with ${conflictNewCourse.code} in your calendar!`);
      }
      }, 0);
    }

    setConflictDialogOpen(false);
    setConflictNewCourse(null);
    setConflictCourse(null);
    setConflictSelectedSchedule('');
  };

  const handleConflictCancel = () => {
    setConflictDialogOpen(false);
    setConflictNewCourse(null);
    setConflictCourse(null);
    setConflictSelectedSchedule('');
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
                      onValueChange={([value]) => handleMinRatingChange(value)}
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
                      onValueChange={([value]) => handleMaxWorkloadChange(value)}
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
                <Select value={prerequisiteFilter} onValueChange={handlePrerequisiteFilterChange}>
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
              
              <Select value={sortBy} onValueChange={handleSortByChange}>
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
            Showing {startIndex + 1}-{Math.min(endIndex, filteredCourses.length)} of {filteredCourses.length} courses
            {filteredCourses.length !== mockCourses.length && ` (${mockCourses.length} total)`}
          </div>

          {/* Course Grid */}
          <div className="grid gap-4">
            {paginatedCourses.map((course) => {
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
                      <h3 className="text-lg">{course.code} - {course.title}</h3>
                        <Badge variant="secondary">{course.credits} credits</Badge>
                        {isInCalendar(course.id) && (
                          <Badge variant="outline" className="border-[#990000] text-[#990000]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            In Calendar
                          </Badge>
                        )}
                      </div>
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
                        Prerequisites: {course.prerequisites.map(formatPrerequisite).join(', ')}
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

          {/* Pagination */}
          {filteredCourses.length > itemsPerPage && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {(() => {
                    const pages: React.ReactNode[] = [];
                    let lastPageAdded = 0;
                    
                    const addPage = (page: number) => {
                      pages.push(
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                      lastPageAdded = page;
                    };
                    
                    const addEllipsis = (key: string) => {
                      pages.push(
                        <PaginationItem key={key}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    };
                    
                    // Always show first page
                    addPage(1);
                    
                    // Show ellipsis if there's a gap after page 1
                    if (currentPage > 3) {
                      addEllipsis('ellipsis-start');
                    }
                    
                    // Show pages around current page
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                      if (i !== lastPageAdded) {
                        addPage(i);
                      }
                    }
                    
                    // Show ellipsis if there's a gap before last page
                    if (currentPage < totalPages - 2 && totalPages > 1) {
                      addEllipsis('ellipsis-end');
                    }
                    
                    // Always show last page (if more than 1 page)
                    if (totalPages > 1 && totalPages !== lastPageAdded) {
                      addPage(totalPages);
                    }
                    
                    return pages;
                  })()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Timeslot Selection Dialog */}
      <Dialog open={timeslotDialogOpen} onOpenChange={setTimeslotDialogOpen}>
        <DialogContent className="bg-white border-2 border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Select Timeslot</DialogTitle>
            <DialogDescription className="text-base text-gray-700">
              {selectedCourseForTimeslot && (
                <p className="mt-2">
                  <span className="font-semibold text-gray-900">{selectedCourseForTimeslot.code}</span> has multiple timeslots. Please select which one you'd like to add to your calendar.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedCourseForTimeslot && (
            <div className="space-y-4 mt-4">
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select a timeslot" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedCourseForTimeslot.schedules && selectedCourseForTimeslot.schedules.length > 0 
                    ? selectedCourseForTimeslot.schedules 
                    : (selectedCourseForTimeslot.schedule ? [selectedCourseForTimeslot.schedule] : [])
                  ).map((schedule, index) => (
                    <SelectItem key={index} value={schedule}>
                      {schedule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setTimeslotDialogOpen(false);
              setSelectedCourseForTimeslot(null);
              setSelectedSchedule('');
            }} className="border-gray-300">
              Cancel
            </Button>
            <Button onClick={handleTimeslotConfirm} style={{ backgroundColor: '#990000', color: 'white' }} className="hover:opacity-90">
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Confirmation Dialog */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-gray-300 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Time Conflict</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              {conflictCourse && conflictNewCourse && (
                <div className="space-y-3 mt-4">
                  <p className="font-semibold text-gray-900">
                    <span className="text-red-600">{conflictNewCourse.code}</span> conflicts with <span className="text-red-600">{conflictCourse.code}</span> that's already in your calendar at this timeslot.
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      Current course:
                    </p>
                    <p className="text-sm text-gray-700">
                      {conflictCourse.code} - {conflictCourse.title}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      New course:
                    </p>
                    <p className="text-sm text-gray-700">
                      {conflictNewCourse.code} - {conflictNewCourse.title}
                    </p>
                  </div>
                  <p className="mt-4 font-semibold text-gray-900 text-base">
                    Would you like to replace the current course in this timeslot?
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConflictCancel} className="border-gray-300">No, Keep Current</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConflictConfirm}
              style={{ backgroundColor: '#990000', color: 'white' }}
              className="hover:opacity-90"
            >
              Yes, Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}