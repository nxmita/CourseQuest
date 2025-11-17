import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, Plus, X, Edit2, Check, AlertCircle, Heart } from 'lucide-react';
import { toast } from "sonner";
import { Course, mockCourses } from './course-data';

interface CalendarViewProps {
  calendarCourses?: Course[];
  onRemoveFromCalendar?: (courseId: string) => void;
  onAddToCalendar?: (course: Course, selectedSchedule?: string) => boolean;
  isLoggedIn?: boolean;
  favoritedCourses?: Course[];
  onToggleFavorite?: (course: Course) => void;
  onCourseSelect?: (course: Course) => void;
  courseSelectedSchedules?: Record<string, string>; // courseId -> selected schedule string
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

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
            timeSlots.push({
              id: `${course.id}-${slot.day}-${slot.startTime}`,
              day: slot.day,
              startTime: slot.startTime,
              endTime: slot.endTime,
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

export function CalendarView({ calendarCourses = [], onRemoveFromCalendar, onAddToCalendar, isLoggedIn = false, favoritedCourses = [], onToggleFavorite, onCourseSelect, courseSelectedSchedules = {} }: CalendarViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [targetCredits, setTargetCredits] = useState(0);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(0);
  
  // Filters
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxWorkload, setMaxWorkload] = useState(5);
  const [prerequisiteFilter, setPrerequisiteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedCredits, setSelectedCredits] = useState<number[]>([]);

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

  const isSlotOccupied = (day: string, time: string) => {
    const normalizedTime = normalizeTimeForComparison(time);
    return userSchedule.some(slot => 
      slot.day === day && normalizeTimeForComparison(slot.startTime) === normalizedTime
    );
  };

  const getSlotCourse = (day: string, time: string) => {
    const normalizedTime = normalizeTimeForComparison(time);
    return userSchedule.find(slot => 
      slot.day === day && normalizeTimeForComparison(slot.startTime) === normalizedTime
    );
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

  const getFilteredCourses = () => {
    try {
      let courses = mockCourses.filter(course => {
        return !calendarCourses.some(calCourse => calCourse && calCourse.id === course.id);
      });

      // Apply filters
      courses = courses.filter(course => {
        const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(course.department);
        const matchesRating = course.rating >= minRating;
        const matchesWorkload = course.workload <= maxWorkload;
        const matchesPrereq = prerequisiteFilter === 'all' || 
                             (prerequisiteFilter === 'yes' && course.prerequisites.length > 0) ||
                             (prerequisiteFilter === 'no' && course.prerequisites.length === 0);
        const matchesCredits = selectedCredits.length === 0 || selectedCredits.includes(course.credits);
        
        return matchesDepartment && matchesRating && matchesWorkload && matchesPrereq && matchesCredits;
      });

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
                <p className="text-sm text-muted-foreground mb-1">Enrolled Credits</p>
                <p className="text-3xl" style={{ color: '#990000' }}>{enrolledCredits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Target Credits</p>
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
                      className="w-20"
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
                    <p className="text-3xl">{targetCredits}</p>
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
                <p className="text-sm text-muted-foreground mb-1">Remaining to Target</p>
                <p 
                  className="text-3xl"
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
                  ? 'Your calendar is empty. Browse courses to get started.' 
                  : `${calendarCourses.length} course${calendarCourses.length > 1 ? 's' : ''} added`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-1 min-w-[700px]">
                  {/* Header Row */}
                  <div className="text-sm p-2">Time</div>
                  {days.map((day) => (
                    <div key={day} className="text-sm p-2 border-b text-center">
                      {day}
                    </div>
                  ))}

                  {/* Time Slots */}
                  {timeSlots.map((time) => (
                    <React.Fragment key={time}>
                      <div className="text-xs text-muted-foreground p-2 border-r text-right">
                        {time}
                      </div>
                      {days.map((day) => {
                        const slotCourse = getSlotCourse(day, time);
                        const isOccupied = isSlotOccupied(day, time);
                        const isSelected = selectedSlot?.day === day && selectedSlot?.time === time;
                        
                        return (
                          <div
                            key={`${day}-${time}`}
                            className={`p-2 border min-h-[60px] transition-colors ${
                              isOccupied 
                                ? 'bg-blue-100 border-blue-500 cursor-default'
                                : isSelected
                                ? 'bg-yellow-100 border-yellow-500 cursor-pointer'
                                : 'hover:bg-gray-50 cursor-pointer border-gray-200'
                            }`}
                            onClick={() => handleSlotClick(day, time)}
                          >
                            {slotCourse?.course && (
                              <div className="text-xs relative group">
                                <div className="font-medium text-blue-900">{slotCourse.course.code}</div>
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
                              <div className="text-xs text-center text-yellow-700">
                                Click again to deselect
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Filters and Available Courses */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters */}
          <Card className="border-2" style={{ borderColor: '#FFCC00' }}>
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
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {selectedSlot 
                      ? 'No courses available for this time slot with current filters'
                      : 'Select a time slot to see available courses'
                    }
                  </div>
                ) : (
                  filteredCourses.map((course) => (
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
                          <p className="text-xs text-muted-foreground">{course.professor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleFavorite(course, e)}
                            className={isFavorited(course.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
                          >
                            <Heart className={`h-4 w-4 ${isFavorited(course.id) ? 'fill-current' : ''}`} />
                          </button>
                          <div className="text-xs">
                            ★ {course.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{course.schedule}</span>
                        <span>Work: {course.workload.toFixed(1)}</span>
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
                            // Find which schedule line matches the selected time slot
                            const matchingSchedule = findMatchingSchedule(course, selectedSlot.day, selectedSlot.time);
                            const wasAdded = onAddToCalendar(course, matchingSchedule || undefined);
                            if (wasAdded) {
                              const scheduleDisplay = matchingSchedule || course.schedule;
                              toast.success(`Added ${course.code} (${scheduleDisplay}) to your calendar!`);
                              setSelectedSlot(null);
                            } else {
                              toast.info(`${course.code} is already in your calendar`);
                            }
                          }
                        }}
                      >
                        {course.conflicts ? 'Time Conflict' : !selectedSlot ? 'Select a time slot first' : <><Plus className="h-3 w-3 mr-1" />Add to Schedule</>}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}