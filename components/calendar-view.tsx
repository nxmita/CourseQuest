import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from './ui/pagination';
import { Calendar, Clock, Plus, X, Edit2, Check, AlertCircle, Heart, ChevronDown } from 'lucide-react';
import { toast } from "sonner";
import { Course, mockCourses } from '../course-data';

interface CalendarViewProps {
  calendarCourses?: Course[];
  onRemoveFromCalendar?: (courseId: string) => void;
  onAddToCalendar?: (course: Course, selectedSchedule?: string) => boolean;
  isLoggedIn?: boolean;
  favoritedCourses?: Course[];
  onToggleFavorite?: (course: Course) => void;
  onCourseSelect?: (course: Course) => void;
  courseSelectedSchedules?: Record<string, string>; // courseId -> selected schedule string
  allReviewsByCourse?: Record<string, any[]>; // For filtering with reviews
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
// Display time slots with 30-minute subdivisions for user selection
const generateTimeSlots = () => {
  const slots: string[] = [];
  // Start from 8:00 AM to 11:30 PM (inclusive)
  for (let hour = 8; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      let displayHour = hour;
      let period = 'AM';
      
      if (hour === 0) {
        displayHour = 12;
        period = 'AM';
      } else if (hour < 12) {
        displayHour = hour;
        period = 'AM';
      } else if (hour === 12) {
        displayHour = 12;
        period = 'PM';
      } else {
        displayHour = hour - 12;
        period = 'PM';
      }
      
      const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      slots.push(timeStr);
      
      // Stop at 11:30 PM
      if (hour === 23 && minute === 30) break;
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Generate 1-minute interval times for precise calculations (internal use only)
const generate1MinuteIntervals = () => {
  const intervals: string[] = [];
  // Start from 8:00 AM to 11:59 PM (inclusive) in 1-minute intervals
  for (let hour = 8; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 1) {
      let displayHour = hour;
      let period = 'AM';
      
      if (hour === 0) {
        displayHour = 12;
        period = 'AM';
      } else if (hour < 12) {
        displayHour = hour;
        period = 'AM';
      } else if (hour === 12) {
        displayHour = 12;
        period = 'PM';
      } else {
        displayHour = hour - 12;
        period = 'PM';
      }
      
      const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      intervals.push(timeStr);
      
      // Stop at 11:59 PM
      if (hour === 23 && minute === 59) break;
    }
  }
  return intervals;
};

const oneMinuteIntervals = generate1MinuteIntervals();

const parseSchedule = (schedule: string) => {
  if (!schedule || typeof schedule !== 'string' || schedule === 'TBA' || schedule.includes('TBA')) {
    return [];
  }
  
  const scheduleSlots = [];
  
  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return '';
    // Normalize to format like "10:00 AM" (hour without leading zero, space before AM/PM)
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
  
  // Handle day patterns
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
  
  // Check for combined patterns first (longer patterns first)
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
    // Check for individual days
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

const convertCoursesToTimeSlots = (courses: Course[], courseSelectedSchedules?: Record<string, string>) => {
  const timeSlots: any[] = [];
  
  courses.forEach(course => {
    try {
      // If a specific schedule was selected for this course, only use that schedule
      // Otherwise, use all schedules (for backward compatibility)
      let schedulesToParse: string[] = [];
      
      if (courseSelectedSchedules && courseSelectedSchedules[course.id]) {
        // Only use the selected schedule for this course
        schedulesToParse = [courseSelectedSchedules[course.id]];
      } else {
        // Use schedules array if available, otherwise fall back to schedule string
        schedulesToParse = (course.schedules && course.schedules.length > 0) 
          ? course.schedules 
          : (course.schedule ? [course.schedule] : []);
      }
      
      schedulesToParse.forEach(scheduleStr => {
        const slots = parseSchedule(scheduleStr);
      slots.forEach(slot => {
        if (slot.day && slot.startTime) {
            // Use the endTime from parsed schedule, or calculate default
            const endTime = slot.endTime || calculateEndTime(slot.startTime);
          timeSlots.push({
            id: `${course.id}-${slot.day}-${slot.startTime}`,
            day: slot.day,
            startTime: slot.startTime,
              endTime: endTime,
            course: {
              id: course.id,
              code: course.code || 'Unknown',
              title: course.title || 'Unknown Course',
              professor: course.professor || 'TBD',
                location: 'TBD',
                fullCourse: course // Store full course object for selection
            }
          });
        }
        });
      });
    } catch (error) {
      console.warn('Error parsing schedule for course:', course.code, error);
    }
  });
  
  return timeSlots;
};

export function CalendarView({ calendarCourses = [], onRemoveFromCalendar, onAddToCalendar, isLoggedIn = false, favoritedCourses = [], onToggleFavorite, onCourseSelect, courseSelectedSchedules = {}, allReviewsByCourse = {} }: CalendarViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [targetCredits, setTargetCredits] = useState(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(0);
  const [timeslotDialogOpen, setTimeslotDialogOpen] = useState(false);
  const [selectedCourseForTimeslot, setSelectedCourseForTimeslot] = useState<Course | null>(null);
  const [selectedScheduleForDialog, setSelectedScheduleForDialog] = useState<string>('');
  
  // Filters
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [prerequisiteFilter, setPrerequisiteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedCredits, setSelectedCredits] = useState<number[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userSchedule = useMemo(() => {
    try {
      return convertCoursesToTimeSlots(calendarCourses || [], courseSelectedSchedules);
    } catch (error) {
      console.error('Error converting courses to time slots:', error);
      return [];
    }
  }, [calendarCourses, courseSelectedSchedules]);

  const enrolledCredits = useMemo(() => {
    return calendarCourses.reduce((sum, course) => sum + course.credits, 0);
  }, [calendarCourses]);

  const remainingCredits = targetCredits - enrolledCredits;

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

  const normalizeTimeForComparison = (timeStr: string) => {
    if (!timeStr) return '';
    // Normalize time string for comparison (remove leading zeros, ensure consistent format)
    return timeStr.replace(/(\d{1,2}):(\d{2})\s?(AM|PM)/i, (match, hour, minute, period) => {
      const hourNum = parseInt(hour, 10);
      return `${hourNum}:${minute} ${period.toUpperCase()}`;
    });
  };

  // Helper function to get all time slots that a course occupies
  const getTimeSlotsForCourse = (slot: any): string[] => {
    if (!slot || !slot.startTime || !slot.endTime) return [slot?.startTime || ''];
    
    const slots: string[] = [];
    const startMin = timeToMinutes(slot.startTime);
    const endMin = timeToMinutes(slot.endTime);
    
    // Find all time slot intervals this course spans
    timeSlots.forEach(slotTime => {
      const slotMin = timeToMinutes(slotTime);
      // Check if this time slot falls within the course's time range
      if (slotMin >= startMin && slotMin < endMin) {
        slots.push(slotTime);
      }
    });
    
    // If no matching slots found, at least return the start time
    return slots.length > 0 ? slots : [slot.startTime];
  };

  // Helper to check if this is the first time block of a multi-hour course
  const isFirstBlockOfCourse = (day: string, time: string, courseSlot: any) => {
    if (!courseSlot) return false;
    
    const timeMin = timeToMinutes(normalizeTimeForComparison(time));
    const slotStartMin = timeToMinutes(courseSlot.startTime);
    
    // Check if this time slot matches the start time of the course
    return timeMin === slotStartMin;
  };

  // Helper to check if the block above is part of the same course
  const hasBlockAbove = (day: string, time: string, courseSlot: any) => {
    if (!courseSlot) return false;
    
    const timeIndex = timeSlots.indexOf(time);
    if (timeIndex <= 0) return false;
    
    const prevTime = timeSlots[timeIndex - 1];
    const prevSlotCourse = getSlotCourse(day, prevTime);
    
    return prevSlotCourse?.course?.id === courseSlot.course?.id;
  };

  const isSlotOccupied = (day: string, time: string) => {
    // Use 1-minute precision internally for accurate highlighting
    const checkTimeMin = timeToMinutes(normalizeTimeForComparison(time));
    // Check all 1-minute intervals within this 30-minute slot
    const slotStartMin = checkTimeMin;
    const slotEndMin = checkTimeMin + 30; // 30 minutes later
    
    return userSchedule.some(slot => {
      if (slot.day !== day) return false;
      
      const courseStartMin = timeToMinutes(slot.startTime);
      const courseEndMin = timeToMinutes(slot.endTime || calculateEndTime(slot.startTime));
      
      // Check if any part of this 30-minute slot overlaps with the course
      // Course overlaps if: courseStartMin < slotEndMin && courseEndMin > slotStartMin
      return courseStartMin < slotEndMin && courseEndMin > slotStartMin;
    });
  };

  const getSlotCourse = (day: string, time: string) => {
    // Use 1-minute precision internally for accurate highlighting
    const checkTimeMin = timeToMinutes(normalizeTimeForComparison(time));
    const slotStartMin = checkTimeMin;
    const slotEndMin = checkTimeMin + 30; // 30 minutes later
    
    return userSchedule.find(slot => {
      if (slot.day !== day) return false;
      
      const courseStartMin = timeToMinutes(slot.startTime);
      const courseEndMin = timeToMinutes(slot.endTime || calculateEndTime(slot.startTime));
      
      // Check if any part of this 30-minute slot overlaps with the course
      return courseStartMin < slotEndMin && courseEndMin > slotStartMin;
    });
  };
  
  // Get precise course block positioning within a 30-minute slot
  const getCourseBlockStyle = (slotCourse: any, time: string): React.CSSProperties | undefined => {
    if (!slotCourse) return undefined;
    
    const slotStartMin = timeToMinutes(normalizeTimeForComparison(time));
    const slotEndMin = slotStartMin + 30; // 30 minutes later
    const courseStartMin = timeToMinutes(slotCourse.startTime);
    const courseEndMin = timeToMinutes(slotCourse.endTime || calculateEndTime(slotCourse.startTime));
    
    // Calculate where the course block starts and ends within this 30-minute slot
    const blockStartMin = Math.max(courseStartMin, slotStartMin);
    const blockEndMin = Math.min(courseEndMin, slotEndMin);
    
    // If course doesn't overlap with this slot, return undefined
    if (blockStartMin >= blockEndMin) return undefined;
    
    // Calculate top offset and height as percentage of the 30-minute slot
    const slotDuration = 30; // 30 minutes
    const topPercent = ((blockStartMin - slotStartMin) / slotDuration) * 100;
    const heightPercent = ((blockEndMin - blockStartMin) / slotDuration) * 100;
    
    return {
      position: 'absolute',
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
      left: 0,
      right: 0,
      backgroundColor: 'rgb(191, 219, 254)', // bg-blue-200
      zIndex: 1
    };
  };

  const handleSlotClick = (day: string, time: string) => {
    const slotCourse = getSlotCourse(day, time);
    
    // If slot is occupied, open course detail
    if (slotCourse && slotCourse.course.fullCourse && onCourseSelect) {
      onCourseSelect(slotCourse.course.fullCourse);
      return;
    }
    
    // Otherwise, handle selection for filtering
    if (isSlotOccupied(day, time)) {
      return; // Don't select occupied slots
    }
    
    if (selectedSlot?.day === day && selectedSlot?.time === time) {
      setSelectedSlot(null); // Deselect if clicking same slot
    } else {
      setSelectedSlot({ day, time });
    }
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

  const calculateEndTime = (startTime: string, endTimeFromSchedule?: string): string => {
    // If end time is provided from schedule, use it
    if (endTimeFromSchedule) {
      return endTimeFromSchedule;
    }
    
    // Otherwise, default to 50 minutes later (standard class length)
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

  const hasScheduleConflict = (course: Course) => {
    try {
      if (!calendarCourses || calendarCourses.length === 0 || !selectedSlot) {
        return false;
      }

      // Get the schedule that matches the selected time slot for the new course
      const matchingSchedule = findMatchingSchedule(course, selectedSlot.day, selectedSlot.time);
      if (!matchingSchedule) {
        return false; // No matching schedule found, no conflict
      }
      
      const newCourseSlots = parseSchedule(matchingSchedule);
      
      return calendarCourses.some(existingCourse => {
        if (!existingCourse) return false;
        
        // Get the selected schedule for existing course, or all schedules if none selected
        let existingCourseSchedules: string[] = [];
        if (courseSelectedSchedules[existingCourse.id]) {
          // Only check against the selected schedule for this course
          existingCourseSchedules = [courseSelectedSchedules[existingCourse.id]];
        } else {
          // Fall back to all schedules (for backward compatibility)
          existingCourseSchedules = (existingCourse.schedules && existingCourse.schedules.length > 0) 
            ? existingCourse.schedules 
            : (existingCourse.schedule ? [existingCourse.schedule] : []);
        }
        
        const existingSlots: any[] = [];
        existingCourseSchedules.forEach(scheduleStr => {
          const slots = parseSchedule(scheduleStr);
          existingSlots.push(...slots);
        });
        
        return newCourseSlots.some(newSlot => {
          if (!newSlot.day || !newSlot.startTime) return false;
          
          return existingSlots.some(existingSlot => {
            if (!existingSlot.day || !existingSlot.startTime) return false;
            
            if (newSlot.day === existingSlot.day) {
              return timesOverlap(
                newSlot.startTime, 
                newSlot.endTime || calculateEndTime(newSlot.startTime),
                existingSlot.startTime, 
                existingSlot.endTime || calculateEndTime(existingSlot.startTime)
              );
            }
            return false;
          });
        });
      });
    } catch (error) {
      console.warn('Error checking schedule conflict:', course.code, error);
      return false;
    }
  };

  const courseMatchesSlot = (course: Course, day: string, time: string) => {
    try {
      // Check all schedules for this course
      const schedulesToCheck = (course.schedules && course.schedules.length > 0) 
        ? course.schedules 
        : (course.schedule ? [course.schedule] : []);
      
      return schedulesToCheck.some(scheduleStr => {
        const courseSlots = parseSchedule(scheduleStr);
        return courseSlots.some(slot => {
          const normalizedSlotTime = normalizeTimeForComparison(slot.startTime);
          const normalizedSelectedTime = normalizeTimeForComparison(time);
          return slot.day === day && normalizedSlotTime === normalizedSelectedTime;
        });
      });
    } catch (error) {
      return false;
    }
  };

  // Find which schedule line matches the selected day and time
  const findMatchingSchedule = (course: Course, day: string, time: string): string | null => {
    try {
      const schedulesToCheck = (course.schedules && course.schedules.length > 0) 
        ? course.schedules 
        : (course.schedule ? [course.schedule] : []);
      
      const normalizedSelectedTime = normalizeTimeForComparison(time);
      
      for (const scheduleStr of schedulesToCheck) {
        const courseSlots = parseSchedule(scheduleStr);
        const matches = courseSlots.some(slot => {
          const normalizedSlotTime = normalizeTimeForComparison(slot.startTime);
          return slot.day === day && normalizedSlotTime === normalizedSelectedTime;
        });
        if (matches) {
          return scheduleStr;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Get course stats from reviews (same as Browse courses)
  const getCourseStats = (course: Course) => {
    const reviews = allReviewsByCourse[course.id] || [];
    
    if (reviews.length === 0) {
      return {
        rating: course.rating || 0,
        reviewCount: course.reviewCount || 0,
        workload: course.workload || 0
      };
    }
    
    const calculateAverage = (values: number[]): number => {
      if (values.length === 0) return 0;
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    };
    
    const ratings = reviews.map((r: any) => r.rating || 0);
    const workloads = reviews.map((r: any) => r.workload || 0);
    
    return {
      rating: calculateAverage(ratings),
      reviewCount: reviews.length,
      workload: calculateAverage(workloads)
    };
  };

  const getFilteredCourses = () => {
    try {
      let courses = mockCourses.filter(course => {
        return !calendarCourses.some(calCourse => calCourse && calCourse.id === course.id);
      });

      // Check if rating/workload filters are being used
      const ratingFiltersActive = minRating > 0 || maxWorkload < 5;
      
      // First, filter by non-rating filters (department, prerequisites, credits)
      let baseFiltered = courses.filter(course => {
        const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(course.department);
        const matchesPrereq = prerequisiteFilter === 'all' || 
                             (prerequisiteFilter === 'yes' && course.prerequisites.length > 0) ||
                             (prerequisiteFilter === 'no' && course.prerequisites.length === 0);
        const matchesCredits = selectedCredits.length === 0 || selectedCredits.includes(course.credits);
        
        return matchesDepartment && matchesPrereq && matchesCredits;
      });

      // If rating filters are active, handle courses with/without ratings like Browse courses
      if (ratingFiltersActive) {
        const withRatings: Course[] = [];
        const withoutRatings: Course[] = [];
        
        baseFiltered.forEach(course => {
          const reviews = allReviewsByCourse[course.id] || [];
          const hasRatings = reviews.length > 0;
          
          if (hasRatings) {
            const stats = getCourseStats(course);
            if (stats.rating >= minRating && stats.workload <= maxWorkload) {
              withRatings.push(course);
            }
          } else {
            // Course doesn't have ratings - always include it (will be shown after courses with ratings)
            withoutRatings.push(course);
          }
        });
        
        // Sort courses with ratings by rating
        withRatings.sort((a, b) => {
          const statsA = getCourseStats(a);
          const statsB = getCourseStats(b);
          return statsB.rating - statsA.rating;
        });
        
        // Sort courses without ratings alphabetically
        withoutRatings.sort((a, b) => a.code.localeCompare(b.code));
        
        courses = [...withRatings, ...withoutRatings];
      } else {
        // No rating filters - sort alphabetically
        courses = baseFiltered.sort((a, b) => a.code.localeCompare(b.code));
      }

      // If a slot is selected, filter for courses that match that time
      if (selectedSlot) {
        courses = courses.filter(course => courseMatchesSlot(course, selectedSlot.day, selectedSlot.time));
      }

      return courses.map(course => ({
        ...course,
        conflicts: hasScheduleConflict(course)
      }));
    } catch (error) {
      console.error('Error filtering courses:', error);
      return [];
    }
  };

  const filteredCourses = getFilteredCourses();
  const activeFiltersCount = selectedDepartments.length + 
    (minRating > 0 ? 1 : 0) + 
    (maxWorkload < 5 ? 1 : 0) + 
    (prerequisiteFilter !== 'all' ? 1 : 0) + 
    selectedCredits.length;

  // Reset to page 1 when filters or selected slot change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSlot, selectedDepartments, minRating, maxWorkload, prerequisiteFilter, selectedCredits]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">My Calendar</h1>
        <p className="text-muted-foreground">
          Plan your schedule visually {!isLoggedIn && '(Login to save permanently)'}
        </p>
      </div>

      {/* Credit Summary */}
      <Card className="mb-6" style={{ borderColor: '#990000', borderWidth: '2px' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Enrolled Credits</p>
                <p className="text-3xl font-bold" style={{ color: '#990000' }}>{enrolledCredits}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Target Credits</p>
                {isEditingTarget ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={tempTarget}
                      onChange={(e) => setTempTarget(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setTargetCredits(tempTarget);
                          setIsEditingTarget(false);
                        }
                      }}
                      className="w-20 font-bold"
                      min="0"
                      max="24"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setTargetCredits(tempTarget);
                        setIsEditingTarget(false);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{targetCredits}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setTempTarget(targetCredits);
                        setIsEditingTarget(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Remaining to Target</p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: remainingCredits >= 0 ? '#FFCC00' : '#d4183d' }}
                >
                  {remainingCredits > 0 ? '+' : ''}{remainingCredits}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Calendar - Main Section */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                {calendarCourses.length === 0 
                  ? 'Your calendar is empty. Browse courses or select time slots below to get started.' 
                  : `${calendarCourses.length} course${calendarCourses.length > 1 ? 's' : ''} added`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 min-w-[800px] border border-gray-300">
                  {/* Header Row */}
                  <div className="text-sm p-2 border-r border-b border-gray-300">Time</div>
                  {days.map((day, index) => (
                    <div 
                      key={day} 
                      className={`text-sm p-2 border-b border-gray-300 text-center ${index < days.length - 1 ? 'border-r' : ''}`}
                    >
                      {day}
                    </div>
                  ))}

                  {/* Time Slots */}
                  {timeSlots.map((time, timeIndex) => {
                    // Check if this is a :30 slot (subdivision) for lighter border
                    const isSubdivision = time.includes(':30');
                    const isHourSlot = time.includes(':00');
                    
                    return (
                      <React.Fragment key={time}>
                        {/* Time column - no subdivision line, only show hour times */}
                        <div className={`text-xs text-muted-foreground p-1 border-r border-b border-gray-300 text-right ${timeIndex === timeSlots.length - 1 ? 'border-b-0' : ''} ${isSubdivision ? 'border-t-0' : ''}`}>
                          {isHourSlot ? time : null}
                        </div>
                        {days.map((day, dayIndex) => {
                          const slotCourse = getSlotCourse(day, time);
                          const isOccupied = isSlotOccupied(day, time);
                          const isSelected = selectedSlot?.day === day && selectedSlot?.time === time;
                          const isFirstBlock = slotCourse ? isFirstBlockOfCourse(day, time, slotCourse) : false;
                          const courseBlockStyle = slotCourse ? getCourseBlockStyle(slotCourse, time) : undefined;
                          
                          // Determine border classes - shared borders between cells
                          // Use lighter borders for :30 subdivisions in day columns only
                          let borderClasses = '';
                          // Always show right border except for last column
                          if (dayIndex < days.length - 1) {
                            borderClasses += `border-r ${isSubdivision ? 'border-gray-200' : 'border-gray-300'} `;
                          }
                          // Show bottom border except for last row
                          if (timeIndex < timeSlots.length - 1) {
                            borderClasses += `border-b ${isSubdivision ? 'border-gray-200' : 'border-gray-300'} `;
                          }
                          
                          // Base background color (without course highlight)
                          let bgColor = '';
                          if (isSelected) {
                            bgColor = 'bg-yellow-100';
                          } else {
                            bgColor = 'hover:bg-gray-50';
                          }
                          
                          return (
                            <div
                              key={`${day}-${time}`}
                              className={`relative p-1 ${borderClasses} ${bgColor} transition-colors ${
                                isOccupied 
                                  ? 'cursor-default'
                                  : 'cursor-pointer'
                              }`}
                              style={{ minHeight: '30px', height: '30px' }}
                              onClick={() => handleSlotClick(day, time)}
                            >
                              {/* Precise course block overlay using 1-minute intervals */}
                              {courseBlockStyle && (
                                <div 
                                  className="absolute left-0 right-0"
                                  style={courseBlockStyle}
                                />
                              )}
                              
                              {slotCourse?.course && isFirstBlock && (
                                <div className="text-xs relative group z-10">
                                  <div className="font-medium text-blue-900">
                                    {slotCourse.course.code}
                                  </div>
                                  {onRemoveFromCalendar && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveFromCalendar(slotCourse.course.id);
                                        toast.success(`Removed ${slotCourse.course.code} from your calendar`);
                                      }}
                                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                                      title="Remove from calendar"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              )}
                              {!isOccupied && isSelected && (
                                <div className="text-xs text-center text-yellow-700 relative z-10">
                                  Click again to deselect
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Filters and Available Courses */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters - Collapsible */}
          <Card className="border-2" style={{ borderColor: '#FFCC00' }}>
            <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors" style={{ backgroundColor: 'rgba(153, 0, 0, 0.05)' }}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold" style={{ color: '#990000' }}>
                  🔍 Filters
                </CardTitle>
                    <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFilters();
                          }}
                    className="text-xs"
                    style={{ color: '#990000', border: '1px solid #FFCC00' }}
                  >
                    Clear All
                  </Button>
                )}
                      <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'transform rotate-180' : ''}`} style={{ color: '#990000' }} />
                    </div>
              </div>
              {activeFiltersCount > 0 && (
                <CardDescription className="text-sm font-medium" style={{ color: '#990000' }}>
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </CardDescription>
              )}
            </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
                        id={`cal-${dept}`}
                        checked={selectedDepartments.includes(dept)}
                        onCheckedChange={() => toggleDepartment(dept)}
                      />
                      <label
                        htmlFor={`cal-${dept}`}
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
                        id={`cal-credit-${credit}`}
                        checked={selectedCredits.includes(credit)}
                        onCheckedChange={() => toggleCredit(credit)}
                      />
                      <label
                        htmlFor={`cal-credit-${credit}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {credit} credits
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Available Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedSlot 
                  ? `Courses for ${selectedSlot.day} at ${selectedSlot.time}` 
                  : 'Available Courses'
                }
              </CardTitle>
              <CardDescription className="text-sm">
                {selectedSlot 
                  ? 'Courses that fit the selected time slot'
                  : 'Click a time slot to see courses'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!selectedSlot ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Select time slots on the calendar to see courses available at that time
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No courses available for this time slot with current filters
                  </div>
                ) : (
                  <>
                    {paginatedCourses.map((course) => (
                    <div
                      key={course.id}
                      className={`p-3 border rounded-lg text-sm ${
                        course.conflicts 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{course.code}</h4>
                            <Badge variant="secondary" className="text-xs">{course.credits}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.professors && course.professors.length > 0 
                              ? (course.professors.length > 1 
                                  ? `${course.professors.join(', ')}`
                                  : course.professors[0])
                              : course.professor}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleFavorite(course, e)}
                            className={isFavorited(course.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
                          >
                            <Heart className={`h-4 w-4 ${isFavorited(course.id) ? 'fill-current' : ''}`} />
                          </button>
                          <div className="text-xs">
                            ★ {getCourseStats(course).rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{course.schedules && course.schedules.length > 0 
                          ? (course.schedules.length > 1 
                              ? `${course.schedules.length} timeslots`
                              : course.schedules[0])
                          : course.schedule}</span>
                        <span>Work: {getCourseStats(course).workload.toFixed(1)}</span>
                      </div>

                      {course.conflicts && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mb-2">
                          <AlertCircle className="h-3 w-3" />
                          <span>Time conflict with existing course</span>
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        className="w-full text-xs h-7"
                        variant={course.conflicts ? "outline" : "default"}
                        disabled={course.conflicts || !selectedSlot}
                        style={!course.conflicts && selectedSlot ? { backgroundColor: '#990000', color: 'white' } : {}}
                        onClick={() => {
                          if (onAddToCalendar && !course.conflicts && selectedSlot) {
                            // Check if course has multiple schedules
                            const availableSchedules = (course.schedules && course.schedules.length > 0) 
                              ? course.schedules 
                              : (course.schedule ? [course.schedule] : []);
                            
                            // If multiple schedules, show dialog to select one
                            if (availableSchedules.length > 1) {
                              setSelectedCourseForTimeslot(course);
                              // Find which schedule line matches the selected time slot as default
                              const matchingSchedule = findMatchingSchedule(course, selectedSlot.day, selectedSlot.time);
                              setSelectedScheduleForDialog(matchingSchedule || availableSchedules[0]);
                              setTimeslotDialogOpen(true);
                            } else {
                              // Single schedule - add directly
                              const schedule = availableSchedules[0];
                              const wasAdded = onAddToCalendar(course, schedule);
                            if (wasAdded) {
                                toast.success(`Added ${course.code} (${schedule}) to your calendar!`);
                              setSelectedSlot(null);
                            } else {
                              toast.info(`${course.code} is already in your calendar`);
                              }
                            }
                          }
                        }}
                      >
                        {course.conflicts ? 'Time Conflict' : !selectedSlot ? 'Select a time slot first' : <><Plus className="h-3 w-3 mr-1" />Add to Schedule</>}
                      </Button>
                    </div>
                    ))}
                    
                    {/* Pagination */}
                    {filteredCourses.length > itemsPerPage && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => {
                                  if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                  }
                                }}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(page)}
                                      isActive={currentPage === page}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => {
                                  if (currentPage < totalPages) {
                                    setCurrentPage(currentPage + 1);
                                  }
                                }}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeslot Selection Dialog for Calendar View */}
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
              <Select value={selectedScheduleForDialog} onValueChange={setSelectedScheduleForDialog}>
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
              setSelectedScheduleForDialog('');
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedCourseForTimeslot && selectedScheduleForDialog && onAddToCalendar) {
                const wasAdded = onAddToCalendar(selectedCourseForTimeslot, selectedScheduleForDialog);
                if (wasAdded) {
                  toast.success(`Added ${selectedCourseForTimeslot.code} (${selectedScheduleForDialog}) to your calendar!`);
                  setSelectedSlot(null);
                } else {
                  toast.info(`${selectedCourseForTimeslot.code} is already in your calendar`);
                }
              }
              setTimeslotDialogOpen(false);
              setSelectedCourseForTimeslot(null);
              setSelectedScheduleForDialog('');
            }} style={{ backgroundColor: '#990000', color: 'white' }} className="hover:opacity-90">
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}