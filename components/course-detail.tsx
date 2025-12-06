import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { ArrowLeft, Star, Clock, Users, Download, Plus, BookOpen, MessageCircle, Upload, FileText, CheckCircle, X, AlertCircle, Heart } from 'lucide-react';
import { toast } from "sonner";
import { Course, Review, mockReviews, mockCourses } from '../course-data';
import { userDatabase } from './user-data';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  calendarCourses?: Course[];
  onAddToCalendar: (course: Course, selectedSchedule?: string) => boolean;
  onRemoveFromCalendar?: (courseId: string) => void;
  onReplaceCourse?: (oldCourseId: string, newCourse: Course, selectedSchedule?: string) => void;
  isLoggedIn?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onReviewSubmit?: (reviewData: any) => void;
  onReviewDelete?: (courseId: string, reviewId: string) => void;
  username?: string;
  localReviews?: any[];
  setLocalReviews?: (reviews: any[]) => void;
  onReviewsUpdate?: (courseId: string, reviews: any[]) => void;
  courseSelectedSchedules?: Record<string, string>;
  initialTab?: string; // Optional prop to set initial tab
}

interface SyllabusUpload {
  id: string;
  semester: string;
  year: string;
  professor: string;
  fileName: string;
  uploadedBy: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const syllabusArchive: any[] = [];

export function CourseDetail({ course, onBack, calendarCourses = [], onAddToCalendar, onRemoveFromCalendar, onReplaceCourse, isLoggedIn = false, isFavorited = false, onToggleFavorite, onReviewSubmit, onReviewDelete, username, localReviews = [], setLocalReviews, onReviewsUpdate, courseSelectedSchedules = {}, initialTab = 'overview' }: CourseDetailProps) {
  // Early validation - must be FIRST before any hooks that use course properties
  if (!course || !course.id || !course.code || !course.title) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">Invalid course data</p>
          <Button onClick={onBack} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState(initialTab);
  const [timeslotDialogOpen, setTimeslotDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictCourse, setConflictCourse] = useState<Course | null>(null);
  const [conflictSelectedSchedule, setConflictSelectedSchedule] = useState<string>('');
  const [newReview, setNewReview] = useState({
    difficulty: 3,
    workload: 3,
    learningGain: 3,
    comment: '',
    isAnonymous: false,
    numExams: undefined as number | undefined,
    numQuizzes: undefined as number | undefined,
    numAssignments: undefined as number | undefined,
    numPresentations: undefined as number | undefined
  });

  const [syllabusUpload, setSyllabusUpload] = useState({
    semester: '',
    year: '',
    professor: '',
    file: null as File | null
  });

  const [uploadedSyllabi, setUploadedSyllabi] = useState<SyllabusUpload[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  
  const isInCalendar = calendarCourses.some(c => c.id === course.id);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [course.id]);

  // Load reviews from global storage on mount
  useEffect(() => {
    const storedReviews = userDatabase.getReviewsForCourse(course.id);
    if (setLocalReviews) {
      setLocalReviews(storedReviews);
    }
  }, [course.id, setLocalReviews]);

  // Get reviews for this course or use empty array - use only local reviews
  const courseReviews = localReviews;

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

  const StarRating = ({ rating, size = 'small' }: { rating: number; size?: 'small' | 'large' }) => {
    const starSize = size === 'large' ? 'h-5 w-5' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleSyllabusUpload = () => {
    if (!isLoggedIn) {
      toast.error('Please login to upload course materials');
      return;
    }

    if (!syllabusUpload.file || !syllabusUpload.semester || !syllabusUpload.year || !syllabusUpload.professor) {
      return;
    }

    const newSyllabus: SyllabusUpload = {
      id: Date.now().toString(),
      semester: syllabusUpload.semester,
      year: syllabusUpload.year,
      professor: syllabusUpload.professor,
      fileName: syllabusUpload.file.name,
      uploadedBy: 'Current User',
      uploadDate: new Date().toLocaleDateString(),
      status: 'pending'
    };

    setUploadedSyllabi([...uploadedSyllabi, newSyllabus]);
    setSyllabusUpload({ semester: '', year: '', professor: '', file: null });
    setUploadSuccess(true);
    
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSyllabusUpload({ ...syllabusUpload, file });
    }
  };

  // Sort syllabi by year (most recent first, Fall > Spring for same year)
  const sortSyllabiByYear = (syllabi: any[]) => {
    return syllabi.sort((a, b) => {
      // Extract year and semester from the semester string
      const getYearAndSemester = (semesterStr: string) => {
        const parts = semesterStr.split(' ');
        const semester = parts[0]; // 'Fall' or 'Spring'
        const year = parseInt(parts[1]); // year as number
        return { semester, year };
      };

      const aData = getYearAndSemester(a.semester);
      const bData = getYearAndSemester(b.semester);

      // First sort by year (descending - most recent first)
      if (aData.year !== bData.year) {
        return bData.year - aData.year;
      }

      // For same year, Fall comes before Spring
      if (aData.semester === 'Fall' && bData.semester === 'Spring') {
        return -1;
      }
      if (aData.semester === 'Spring' && bData.semester === 'Fall') {
        return 1;
      }

      return 0;
    });
  };

  const allSyllabi = sortSyllabiByYear([...syllabusArchive, ...uploadedSyllabi]);

  const getCurrentYear = () => new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => getCurrentYear() - i);

  // Helper functions for schedule parsing and conflict checking (same as course-browser)
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
      dayMap['MWF'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
    } else if (schedule.includes('TTh') || schedule.includes('TuTh')) {
      dayMap['TTh'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
    } else if (schedule.includes('MW')) {
      dayMap['MW'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
    } else {
      if (schedule.includes(' M ') || schedule.startsWith('M ') || schedule.includes(' M')) {
        dayMap['M'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
      }
      if (schedule.includes(' T ') || schedule.startsWith('T ') || (schedule.includes(' T') && !schedule.includes('Th'))) {
        dayMap['T'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
      }
      if (schedule.includes(' W ') || schedule.startsWith('W ') || schedule.includes(' W')) {
        dayMap['W'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
      }
      if (schedule.includes('Th ') || schedule.includes(' Th')) {
        dayMap['Th'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
      }
      if (schedule.includes(' F ') || schedule.startsWith('F ') || schedule.includes(' F')) {
        dayMap['F'].forEach(day => scheduleSlots.push({ day, startTime, endTime }));
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

  // Check for conflicts between a schedule and existing calendar courses
  const checkScheduleConflict = (newSchedule: string, newCourse: Course): { hasConflict: boolean; conflictingCourse: Course | null } => {
    if (!calendarCourses || calendarCourses.length === 0) {
      return { hasConflict: false, conflictingCourse: null };
    }
    const newSlots = parseSchedule(newSchedule);
    for (const existingCourse of calendarCourses) {
      if (existingCourse.id === newCourse.id) {
        continue;
      }
      let existingSchedules: string[] = [];
      if (courseSelectedSchedules[existingCourse.id]) {
        existingSchedules = [courseSelectedSchedules[existingCourse.id]];
      } else {
        existingSchedules = (existingCourse.schedules && existingCourse.schedules.length > 0) 
          ? existingCourse.schedules 
          : (existingCourse.schedule ? [existingCourse.schedule] : []);
      }
      for (const existingSchedule of existingSchedules) {
        const existingSlots = parseSchedule(existingSchedule);
        for (const newSlot of newSlots) {
          if (!newSlot.day || !newSlot.startTime) continue;
          for (const existingSlot of existingSlots) {
            if (!existingSlot.day || !existingSlot.startTime) continue;
            if (newSlot.day === existingSlot.day) {
              const newEndTime = newSlot.endTime || calculateEndTime(newSlot.startTime);
              const existingEndTime = existingSlot.endTime || calculateEndTime(existingSlot.startTime);
              if (timesOverlap(newSlot.startTime, newEndTime, existingSlot.startTime, existingEndTime)) {
                return { hasConflict: true, conflictingCourse: existingCourse };
              }
            }
          }
        }
      }
    }
    return { hasConflict: false, conflictingCourse: null };
  };

  const handleAddToCalendar = () => {
    // Check if course is already in calendar
    if (isInCalendar) {
      toast.info(`${course.code} is already in your calendar`);
      return;
    }

    // Get available schedules for this course
    const availableSchedules = (course.schedules && course.schedules.length > 0) 
      ? course.schedules 
      : (course.schedule ? [course.schedule] : []);

    // If course has multiple schedules, show timeslot selection dialog
    if (availableSchedules.length > 1) {
      setSelectedSchedule(availableSchedules[0]);
      setTimeslotDialogOpen(true);
      return;
    }

    // Single schedule - check for conflicts directly
    if (availableSchedules.length === 1) {
      const schedule = availableSchedules[0];
      const conflict = checkScheduleConflict(schedule, course);
      
      if (conflict.hasConflict && conflict.conflictingCourse) {
        // Show conflict dialog
        setConflictCourse(conflict.conflictingCourse);
        setConflictSelectedSchedule(schedule);
        setConflictDialogOpen(true);
        return;
      }
      
      // No conflict, add directly
      const wasAdded = onAddToCalendar(course, schedule);
      if (wasAdded) {
        toast.success(`Added ${course.code} to your calendar!`);
        setActionSuccess(true);
        setTimeout(() => setActionSuccess(false), 3000);
      } else {
        toast.info(`${course.code} is already in your calendar`);
      }
    }
  };

  const handleTimeslotConfirm = () => {
    if (!selectedSchedule) return;

    // Check for conflicts with the selected schedule
    const conflict = checkScheduleConflict(selectedSchedule, course);
    
    if (conflict.hasConflict && conflict.conflictingCourse) {
      // Show conflict dialog
      setConflictCourse(conflict.conflictingCourse);
      setConflictSelectedSchedule(selectedSchedule);
      setTimeslotDialogOpen(false);
      setConflictDialogOpen(true);
      return;
    }

    // No conflict, add the course
    const wasAdded = onAddToCalendar(course, selectedSchedule);
    if (wasAdded) {
      toast.success(`Added ${course.code} (${selectedSchedule}) to your calendar!`);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    }
    
    setTimeslotDialogOpen(false);
    setSelectedSchedule('');
  };

  const handleConflictConfirm = () => {
    if (!conflictSelectedSchedule || !conflictCourse) return;

    if (onReplaceCourse) {
      onReplaceCourse(conflictCourse.id, course, conflictSelectedSchedule);
      toast.success(`Replaced ${conflictCourse.code} with ${course.code} in your calendar!`);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    } else if (onRemoveFromCalendar && onAddToCalendar) {
      onRemoveFromCalendar(conflictCourse.id);
      setTimeout(() => {
        const wasAdded = onAddToCalendar(course, conflictSelectedSchedule);
        if (wasAdded) {
          toast.success(`Replaced ${conflictCourse.code} with ${course.code} in your calendar!`);
          setActionSuccess(true);
          setTimeout(() => setActionSuccess(false), 3000);
        }
      }, 0);
    }

    setConflictDialogOpen(false);
    setConflictCourse(null);
    setConflictSelectedSchedule('');
  };

  const handleConflictCancel = () => {
    setConflictDialogOpen(false);
    setConflictCourse(null);
    setConflictSelectedSchedule('');
  };

  const handleRemoveFromCalendar = () => {
    if (isInCalendar && onRemoveFromCalendar) {
      onRemoveFromCalendar(course.id);
      toast.success(`Removed ${course.code} from your calendar`);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    }
  };

  const handleSubmitReview = () => {
    // Allow reviews from anyone (logged in or not)
    if (!newReview.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    // Check if user already has a review for this course
    if (userDatabase.hasUserReviewedCourse(course.id)) {
      toast.error('You can only write one review per course. Please delete your existing review first.');
      return;
    }

    // Invert difficulty and workload (1=5, 2=4, 3=3, 4=2, 5=1), keep learning gain as is
    const invertedDifficulty = 6 - newReview.difficulty;
    const invertedWorkload = 6 - newReview.workload;
    const overall = ((invertedDifficulty + invertedWorkload + newReview.learningGain) / 3);
    
    const newReviewData = {
      courseId: course.id,
      studentName: newReview.isAnonymous ? 'Anonymous Trojan' : (username || 'Anonymous User'),
      isAnonymous: newReview.isAnonymous,
      semester: 'Fall 2024',
      difficulty: newReview.difficulty,
      workload: newReview.workload,
      learningGain: newReview.learningGain,
      overall: parseFloat(overall.toFixed(1)),
      comment: newReview.comment,
      helpful: 0,
      numExams: newReview.numExams,
      numQuizzes: newReview.numQuizzes,
      numAssignments: newReview.numAssignments,
      numPresentations: newReview.numPresentations
    };

    try {
      // Save to global storage
      const savedReview = userDatabase.addReview(newReviewData);
      
      // Reload reviews from storage to get the latest
      const updatedReviews = userDatabase.getReviewsForCourse(course.id);
      if (setLocalReviews) {
        setLocalReviews(updatedReviews);
      }
      
      // Update all reviews by course
      if (onReviewsUpdate) {
        onReviewsUpdate(course.id, updatedReviews);
      }

      // Call parent handler
      if (onReviewSubmit) {
        onReviewSubmit(newReview);
      }

      toast.success('Your review has been submitted.');
      
      setNewReview({
        difficulty: 3,
        workload: 3,
        learningGain: 3,
        comment: '',
        isAnonymous: false,
        numExams: undefined,
        numQuizzes: undefined,
        numAssignments: undefined,
        numPresentations: undefined
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    }
  };

  // Calculate averages from reviews for difficulty, workload, and learning gain
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  };

  const safeCourseReviews = Array.isArray(courseReviews) ? courseReviews : [];
  const avgDifficulty = calculateAverage(safeCourseReviews.map(r => r?.difficulty || 0));
  const avgWorkload = calculateAverage(safeCourseReviews.map(r => r?.workload || 0));
  const avgLearningGain = calculateAverage(safeCourseReviews.map(r => r?.learningGain || 0));
  
  // Use averages from reviews if available, otherwise use course defaults
  const displayDifficulty = safeCourseReviews.length > 0 ? avgDifficulty : (course.difficulty || 0);
  const displayWorkload = safeCourseReviews.length > 0 ? avgWorkload : (course.workload || 0);
  const displayLearningGain = safeCourseReviews.length > 0 ? avgLearningGain : (course.learningGain || 0);
  
  // Calculate overall rating: invert difficulty and workload (1=5, 2=4, 3=3, 4=2, 5=1), keep learning gain as is
  const invertedDifficulty = 6 - displayDifficulty;
  const invertedWorkload = 6 - displayWorkload;
  const overallRating = ((invertedDifficulty + invertedWorkload + displayLearningGain) / 3).toFixed(1);

  // Get value from reviews: if only one review has a value, use it (even if 0), otherwise return undefined
  const getSingleReviewValue = (values: (number | undefined)[]): number | undefined => {
    // Filter out undefined values, but keep 0 values
    const definedValues = values.filter((v): v is number => v !== undefined && v !== null);
    
    // If no values at all, return undefined
    if (definedValues.length === 0) {
      return undefined;
    }
    
    // If only one review has a value, use it (even if it's 0)
    if (definedValues.length === 1) {
      return definedValues[0];
    }
    
    // If multiple reviews have values, return undefined (will show hyphen)
    return undefined;
  };

  // Get values from reviews
  const numExams = getSingleReviewValue(safeCourseReviews.map(r => r?.numExams));
  const numQuizzes = getSingleReviewValue(safeCourseReviews.map(r => r?.numQuizzes));
  const numAssignments = getSingleReviewValue(safeCourseReviews.map(r => r?.numAssignments));
  const numPresentations = getSingleReviewValue(safeCourseReviews.map(r => r?.numPresentations));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Course Header */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl">{course.code} - {course.title}</h1>
              <Badge variant="secondary">{course.credits} credits</Badge>
            </div>
            <p className="text-muted-foreground">
              {course.professors && course.professors.length > 0 
                ? (course.professors.length > 1 
                    ? `${course.professors.join(', ')} • ${course.department}`
                    : `${course.professors[0]} • ${course.department}`)
                : `${course.professor} • ${course.department}`}
            </p>
            {course.schedules && course.schedules.length > 0 ? (
              <div className="text-sm text-muted-foreground mt-1">
                {course.schedules.length > 1 ? (
                  <div>
                    <p className="font-semibold mb-1">Available Timeslots:</p>
                    {course.schedules.map((schedule, idx) => (
                      <p key={idx} className="ml-2">• {schedule}</p>
                    ))}
                  </div>
                ) : (
                  <p>{course.schedules[0]}</p>
                )}
              </div>
            ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {course.schedule}
            </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onToggleFavorite}
              className={isFavorited ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
            </Button>
            {isInCalendar ? (
              <Button 
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                onClick={handleRemoveFromCalendar}
                disabled={actionSuccess}
              >
                {actionSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Removed!
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Drop
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleAddToCalendar}
                disabled={actionSuccess}
                style={{ backgroundColor: '#990000', color: 'white' }}
                className="hover:opacity-90"
              >
                {actionSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Added!
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Rating Overview - Split into 3 dimensions + Overall */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="h-5 w-5" style={{ color: '#FFCC00' }} />
              <span className="text-xl" style={{ color: '#990000' }}>
                {overallRating}
              </span>
            </div>
            <p className="text-sm">Overall Score</p>
            <p className="text-xs text-muted-foreground">{courseReviews.length} reviews</p>
          </div>
          
          <div className="text-center">
            <div className="text-xl mb-1">{displayDifficulty.toFixed(1)}/5</div>
            <p className="text-sm">Difficulty</p>
            <Progress value={displayDifficulty * 20} className="h-2 mt-1" />
          </div>
          
          <div className="text-center">
            <div className="text-xl mb-1">{displayWorkload.toFixed(1)}/5</div>
            <p className="text-sm">Workload</p>
            <Progress value={displayWorkload * 20} className="h-2 mt-1" />
          </div>
          
          <div className="text-center">
            <div className="text-xl mb-1">{displayLearningGain.toFixed(1)}/5</div>
            <p className="text-sm">Learning Gain</p>
            <Progress value={displayLearningGain * 20} className="h-2 mt-1" />
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-red-900"
            style={{ 
              color: '#6B7280',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="reviews"
            className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-red-900"
            style={{ 
              color: '#6B7280',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Reviews ({courseReviews.length})
          </TabsTrigger>
          <TabsTrigger 
            value="syllabus"
            className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-red-900"
            style={{ 
              color: '#6B7280',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Syllabus Archive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 p-6 bg-gray-50 rounded-lg">
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0 ? (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Prerequisites
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {course.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="outline">{formatPrerequisite(prereq)}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Prerequisites
                    </h4>
                    <p className="text-muted-foreground">No prerequisites</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Exams</p>
                    <p className="text-xl">{numExams !== undefined ? numExams : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quizzes</p>
                    <p className="text-xl">{numQuizzes !== undefined ? numQuizzes : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                    <p className="text-xl">{numAssignments !== undefined ? numAssignments : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Presentations</p>
                    <p className="text-xl">{numPresentations !== undefined ? numPresentations : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
            {/* Write Review Form at the top */}
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
                <CardDescription>
                  Help future students by sharing your experience with this course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userDatabase.hasUserReviewedCourse(course.id) ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">You have already reviewed this course.</span>
                  </div>
                ) : (
                  <>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="block text-sm mb-3 font-semibold" style={{ color: '#990000' }}>
                      Difficulty (1-5)
                    </Label>
                    <div className="space-y-3">
                      <div className="px-2">
                        <Slider
                          value={[newReview.difficulty]}
                          onValueChange={([value]) => setNewReview({...newReview, difficulty: value})}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full h-8"
                          disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Easy</span>
                        <span className="font-medium text-primary">{newReview.difficulty}</span>
                        <span>Hard</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm mb-3 font-semibold" style={{ color: '#990000' }}>
                      Workload (1-5)
                    </Label>
                    <div className="space-y-3">
                      <div className="px-2">
                        <Slider
                          value={[newReview.workload]}
                          onValueChange={([value]) => setNewReview({...newReview, workload: value})}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full h-8"
                          disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Light</span>
                        <span className="font-medium text-primary">{newReview.workload}</span>
                        <span>Heavy</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm mb-3 font-semibold" style={{ color: '#990000' }}>
                      Learning Gain (1-5)
                    </Label>
                    <div className="space-y-3">
                      <div className="px-2">
                        <Slider
                          value={[newReview.learningGain]}
                          onValueChange={([value]) => setNewReview({...newReview, learningGain: value})}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full h-8"
                          disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Low</span>
                        <span className="font-medium text-primary">{newReview.learningGain}</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Your Review</label>
                    <Textarea
                      placeholder="Share your experience with this course. What did you like? What was challenging? Any tips for future students?"
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      className="min-h-32"
                      disabled={userDatabase.hasUserReviewedCourse(course.id)}
                    />
                </div>

                <div>
                  <Label className="block text-sm mb-3 font-semibold" style={{ color: '#990000' }}>
                    Course Structure (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Help other students by sharing how many exams, quizzes, assignments, and presentations this course had
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="numExams" className="text-xs text-muted-foreground">Exams</Label>
                      <Input
                        id="numExams"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newReview.numExams === undefined ? '' : newReview.numExams}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          setNewReview({...newReview, numExams: value});
                        }}
                        disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="numQuizzes" className="text-xs text-muted-foreground">Quizzes</Label>
                      <Input
                        id="numQuizzes"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newReview.numQuizzes === undefined ? '' : newReview.numQuizzes}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          setNewReview({...newReview, numQuizzes: value});
                        }}
                        disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="numAssignments" className="text-xs text-muted-foreground">Assignments</Label>
                      <Input
                        id="numAssignments"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newReview.numAssignments === undefined ? '' : newReview.numAssignments}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          setNewReview({...newReview, numAssignments: value});
                        }}
                        disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="numPresentations" className="text-xs text-muted-foreground">Presentations</Label>
                      <Input
                        id="numPresentations"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newReview.numPresentations === undefined ? '' : newReview.numPresentations}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          setNewReview({...newReview, numPresentations: value});
                        }}
                        disabled={userDatabase.hasUserReviewedCourse(course.id)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={newReview.isAnonymous}
                    onCheckedChange={(checked) => setNewReview({...newReview, isAnonymous: checked as boolean})}
                    disabled={userDatabase.hasUserReviewedCourse(course.id)}
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Post anonymously (your identity will be hidden but verified as a USC student)
                  </label>
                </div>

                <Button 
                  onClick={handleSubmitReview}
                  style={{ backgroundColor: '#990000', color: 'white' }}
                  className="hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Submit Review
                </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Reviews List */}
            {courseReviews.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to review this course!
                  </p>
                </CardContent>
              </Card>
            ) : (
              courseReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {review.isAnonymous ? 'Anonymous Trojan' : review.studentName}
                          </CardTitle>
                          {review.isAnonymous && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.overall} />
                        <span className="font-medium">{review.overall}/5</span>
                        {/* Show delete button only for reviews the user can delete */}
                        {userDatabase.canDeleteReview(review.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              try {
                                const deleted = userDatabase.deleteReview(review.id);
                                if (deleted) {
                                  // Reload reviews from storage
                                  const updatedReviews = userDatabase.getReviewsForCourse(course.id);
                                  if (setLocalReviews) {
                                    setLocalReviews(updatedReviews);
                                  }
                                  if (onReviewsUpdate) {
                                    onReviewsUpdate(course.id, updatedReviews);
                                  }
                                  if (onReviewDelete) {
                                    onReviewDelete(course.id, review.id);
                                  }
                                  toast.success('Review deleted successfully');
                                } else {
                                  toast.error('You can only delete your own reviews');
                                }
                              } catch (error) {
                                console.error('Error deleting review:', error);
                                toast.error('Failed to delete review');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete your review"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Difficulty</p>
                        <p className="font-medium">{review.difficulty}/5</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Workload</p>
                        <p className="font-medium">{review.workload}/5</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Learning Gain</p>
                        <p className="font-medium">{review.learningGain}/5</p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      {review.comment}
                    </p>
                    
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="syllabus">
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
            {/* Archive Section */}
            <Card>
              <CardHeader>
                <CardTitle>Syllabus Archive</CardTitle>
                <CardDescription>
                  Download syllabi from previous semesters to understand course expectations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allSyllabi.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No syllabi available yet. Upload a syllabus to help other students!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allSyllabi.map((syllabus, index) => (
                      <div key={syllabus.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {syllabus.semester} {syllabus.year || ''}
                            </p>
                            {syllabus.status === 'pending' && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Pending Review
                              </Badge>
                            )}
                            {syllabus.status === 'approved' && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{syllabus.professor}</p>
                          {syllabus.uploadedBy && (
                            <p className="text-xs text-muted-foreground">
                              Uploaded by {syllabus.uploadedBy} {syllabus.uploadDate && `on ${syllabus.uploadDate}`}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={syllabus.status === 'pending'}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {syllabus.status === 'pending' ? 'Reviewing...' : 'Download PDF'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Syllabus
                </CardTitle>
                <CardDescription>
                  Help other students by sharing the latest syllabus for this course
                  {!isLoggedIn && ' (Login required)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Syllabus uploaded successfully! It will be reviewed and made available soon.</span>
                  </div>
                )}

                {!isLoggedIn && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Please login to upload course materials</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select 
                      value={syllabusUpload.semester} 
                      onValueChange={(value) => setSyllabusUpload({...syllabusUpload, semester: value})}
                      disabled={!isLoggedIn}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spring">Spring</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                        <SelectItem value="Fall">Fall</SelectItem>
                        <SelectItem value="Winter">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select 
                      value={syllabusUpload.year} 
                      onValueChange={(value) => setSyllabusUpload({...syllabusUpload, year: value})}
                      disabled={!isLoggedIn}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="professor">Professor</Label>
                    <Input
                      id="professor"
                      placeholder="Professor name"
                      value={syllabusUpload.professor}
                      onChange={(e) => setSyllabusUpload({...syllabusUpload, professor: e.target.value})}
                      disabled={!isLoggedIn}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="syllabus-file">Syllabus PDF</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="syllabus-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg ${isLoggedIn ? 'cursor-pointer bg-gray-50 hover:bg-gray-100' : 'cursor-not-allowed bg-gray-100 opacity-60'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {syllabusUpload.file ? (
                            <>
                              <FileText className="w-8 h-8 mb-2 text-green-500" />
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{syllabusUpload.file.name}</span>
                              </p>
                              <p className="text-xs text-gray-500">Click to change file</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-medium">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PDF files only</p>
                            </>
                          )}
                        </div>
                        <input
                          id="syllabus-file"
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={handleFileChange}
                          disabled={!isLoggedIn}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSyllabusUpload}
                  disabled={!isLoggedIn || !syllabusUpload.file || !syllabusUpload.semester || !syllabusUpload.year || !syllabusUpload.professor}
                  className="w-full"
                  style={{ backgroundColor: '#990000', color: 'white' }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Syllabus
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Timeslot Selection Dialog */}
      <Dialog open={timeslotDialogOpen} onOpenChange={setTimeslotDialogOpen}>
        <DialogContent className="bg-white border-2 border-gray-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Select Timeslot</DialogTitle>
            <DialogDescription className="text-base text-gray-700">
              {course && (
                <p className="mt-2">
                  <span className="font-semibold text-gray-900">{course.code}</span> has multiple timeslots. Please select which one you'd like to add to your calendar.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          {course && (
            <div className="space-y-4 mt-4">
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Select a timeslot" />
                </SelectTrigger>
                <SelectContent>
                  {((course.schedules && course.schedules.length > 0) 
                    ? course.schedules 
                    : (course.schedule ? [course.schedule] : [])
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
              {conflictCourse && course && (
                <div className="space-y-3 mt-4">
                  <p className="font-semibold text-gray-900">
                    <span className="text-red-600">{course.code}</span> conflicts with <span className="text-red-600">{conflictCourse.code}</span> that's already in your calendar at this timeslot.
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
                      {course.code} - {course.title}
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