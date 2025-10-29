import React, { useState } from 'react';
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
import { ArrowLeft, Star, Clock, Users, Download, Plus, BookOpen, MessageCircle, Upload, FileText, CheckCircle, X, AlertCircle, Heart } from 'lucide-react';
import { toast } from "sonner";
import { Course, Review, mockReviews } from './course-data';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  calendarCourses?: Course[];
  onAddToCalendar: (course: Course) => boolean;
  onRemoveFromCalendar?: (courseId: string) => void;
  isLoggedIn?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onReviewSubmit?: (reviewData: any) => void;
  onReviewDelete?: (courseId: string, reviewId: string) => void;
  username?: string;
  localReviews?: any[];
  setLocalReviews?: (reviews: any[]) => void;
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

const syllabusArchive = [
  { id: '1', semester: 'Fall 2024', professor: 'Dr. William G.J. Halfond', downloadUrl: '#', uploadedBy: 'Student', status: 'approved' as const },
  { id: '2', semester: 'Spring 2024', professor: 'Dr. William G.J. Halfond', downloadUrl: '#', uploadedBy: 'Student', status: 'approved' as const },
  { id: '3', semester: 'Fall 2023', professor: 'Prof. Aaron Cote', downloadUrl: '#', uploadedBy: 'Student', status: 'approved' as const },
];

export function CourseDetail({ course, onBack, calendarCourses = [], onAddToCalendar, onRemoveFromCalendar, isLoggedIn = false, isFavorited = false, onToggleFavorite, onReviewSubmit, onReviewDelete, username, localReviews = [], setLocalReviews }: CourseDetailProps) {
  const [newReview, setNewReview] = useState({
    difficulty: 3,
    workload: 3,
    learningGain: 3,
    comment: '',
    isAnonymous: false
  });

  // Use localReviews from props instead of local state

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

  // Get reviews for this course or use empty array - use only local reviews
  const courseReviews = localReviews;

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

  const handleAddToCalendar = () => {
    if (!isInCalendar) {
      const wasAdded = onAddToCalendar(course);
      if (wasAdded) {
        toast.success(`Added ${course.code} to your calendar!`);
        setActionSuccess(true);
        setTimeout(() => setActionSuccess(false), 3000);
      } else {
        toast.info(`${course.code} is already in your calendar`);
      }
    }
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
    if (!isLoggedIn) {
      toast.error('Please login to post reviews');
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    const overall = ((newReview.difficulty + newReview.workload + newReview.learningGain) / 3);
    
    const newReviewData: Review = {
      id: `review-${Date.now()}`,
      studentName: newReview.isAnonymous ? 'Anonymous Trojan' : (username || 'Current User'),
      isAnonymous: newReview.isAnonymous,
      semester: 'Fall 2024',
      difficulty: newReview.difficulty,
      workload: newReview.workload,
      learningGain: newReview.learningGain,
      overall: parseFloat(overall.toFixed(1)),
      comment: newReview.comment,
      helpful: 0
    };

    // Add to local reviews at the top
    if (setLocalReviews) {
      setLocalReviews([newReviewData, ...localReviews]);
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
      isAnonymous: false
    });
  };

  const overallRating = ((course.difficulty + course.workload + course.learningGain) / 3).toFixed(1);

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
              <h1 className="text-3xl">{course.code}</h1>
              <Badge variant="secondary">{course.credits} credits</Badge>
            </div>
            <h2 className="text-xl text-muted-foreground mb-2">{course.title}</h2>
            <p className="text-muted-foreground">
              {course.professor} • {course.department}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {course.schedule}
            </p>
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
                    Select
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
            <p className="text-xs text-muted-foreground">{course.reviewCount} reviews</p>
          </div>
          
          <div className="text-center">
            <div className="text-xl mb-1">{course.difficulty.toFixed(1)}/5</div>
            <p className="text-sm">Difficulty</p>
            <Progress value={course.difficulty * 20} className="h-2 mt-1" />
          </div>
          
          <div className="text-center">
            <div className="text-xl mb-1">{course.workload.toFixed(1)}/5</div>
            <p className="text-sm">Workload</p>
            <Progress value={course.workload * 20} className="h-2 mt-1" />
          </div>
          
          <div className="text-center">
            <div className="text-xl mb-1">{course.learningGain.toFixed(1)}/5</div>
            <p className="text-sm">Learning Gain</p>
            <Progress value={course.learningGain * 20} className="h-2 mt-1" />
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
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
          <TabsTrigger 
            value="add-review"
            className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-red-900"
            style={{ 
              color: '#6B7280',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Write Review
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
                {course.prerequisites.length > 0 && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Prerequisites
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {course.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="outline">{prereq}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-2">Evaluation Methods</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.evaluationMethods.map((method) => (
                      <Badge key={method} variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">{method}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Exams</p>
                    <p className="text-xl">{course.numExams}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quizzes</p>
                    <p className="text-xl">{course.numQuizzes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                    <p className="text-xl">{course.numAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
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
                        {/* Show delete button only for current user's reviews */}
                        {isLoggedIn && username && review.studentName === username && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (onReviewDelete) {
                                onReviewDelete(course.id, review.id);
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

            {/* Archive Section */}
            <Card>
              <CardHeader>
                <CardTitle>Syllabus Archive</CardTitle>
                <CardDescription>
                  Download syllabi from previous semesters to understand course expectations
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="add-review">
          <div className="p-6 bg-gray-50 rounded-lg">
            <Card>
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
              <CardDescription>
                Help future students by sharing your experience with this course
                {!isLoggedIn && ' (Login required)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isLoggedIn && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Please login to post reviews</span>
                </div>
              )}

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
                        disabled={!isLoggedIn}
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
                        disabled={!isLoggedIn}
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
                        disabled={!isLoggedIn}
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
                  disabled={!isLoggedIn}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={newReview.isAnonymous}
                  onCheckedChange={(checked) => setNewReview({...newReview, isAnonymous: checked as boolean})}
                  disabled={!isLoggedIn}
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
                disabled={!isLoggedIn}
                style={{ backgroundColor: '#990000', color: 'white' }}
                className="hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Submit Review
              </Button>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}