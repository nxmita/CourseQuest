import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, BookOpen, Heart, CheckCircle, Edit2, LogOut, Plus, X, Search } from 'lucide-react';
import { Course, mockCourses } from './course-data';

interface ProfilePageProps {
  username: string;
  isVerifiedStudent: boolean;
  userMajor: string;
  onMajorChange: (major: string) => void;
  courseHistory: Array<{
    course: Course;
    hasReview: boolean;
    reviewData?: any;
  }>;
  favoritedCourses: Course[];
  targetCredits: number;
  onTargetCreditsChange: (credits: number) => void;
  totalCreditsTaken: number;
  currentEnrolledCredits: number;
  onCourseSelect: (course: Course) => void;
  onWriteReview: (course: Course) => void;
  onEditReview: (course: Course) => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onAddCompletedCourse?: (course: Course) => void;
  onRemoveCompletedCourse?: (courseId: string) => void;
}

export function ProfilePage({
  username,
  isVerifiedStudent,
  userMajor,
  onMajorChange,
  courseHistory,
  favoritedCourses,
  targetCredits,
  onTargetCreditsChange,
  totalCreditsTaken,
  currentEnrolledCredits,
  onCourseSelect,
  onWriteReview,
  onEditReview,
  onNavigate,
  onLogout,
  onAddCompletedCourse,
  onRemoveCompletedCourse,
}: ProfilePageProps) {
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [majorInput, setMajorInput] = useState(userMajor);
  const [isEditingTargetCredits, setIsEditingTargetCredits] = useState(false);
  const [targetCreditsInput, setTargetCreditsInput] = useState(targetCredits.toString());
  const [isEditingCompletedCredits, setIsEditingCompletedCredits] = useState(false);
  const [completedCreditsInput, setCompletedCreditsInput] = useState(totalCreditsTaken.toString());
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  const handleMajorSave = () => {
    onMajorChange(majorInput);
    setIsEditingMajor(false);
  };

  const handleTargetCreditsSave = () => {
    const credits = parseInt(targetCreditsInput);
    if (!isNaN(credits) && credits > 0) {
      onTargetCreditsChange(credits);
      setIsEditingTargetCredits(false);
    }
  };

  const handleCompletedCreditsSave = () => {
    const credits = parseInt(completedCreditsInput);
    if (!isNaN(credits) && credits >= 0) {
      // This would need to be implemented in the parent component
      setIsEditingCompletedCredits(false);
    }
  };

  const totalCreditsRequired = targetCredits - totalCreditsTaken;
  const completedCourseIds = courseHistory.map(item => item.course.id);
  const availableCourses = mockCourses.filter(course => 
    !completedCourseIds.includes(course.id) &&
    (courseSearchQuery === '' || 
     course.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
     course.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
     course.professor.toLowerCase().includes(courseSearchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(153, 0, 0, 0.1)' }}>
              <User className="h-8 w-8" style={{ color: '#990000' }} />
            </div>
            <div>
              <h1 className="text-3xl">{username}</h1>
              {isVerifiedStudent && (
                <Badge variant="secondary" className="mt-1" style={{ backgroundColor: '#FFCC00', color: '#000' }}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified Student
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex items-center gap-2"
            style={{ borderColor: '#990000', color: '#990000' }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        
        {/* Quick Navigation */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => onNavigate('landing')}>
            Home
          </Button>
          <Button variant="outline" onClick={() => onNavigate('browse')}>
            Browse Courses
          </Button>
          <Button variant="outline" onClick={() => onNavigate('calendar')}>
            Calendar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Credit Summary - Now at the top */}
        <Card className="border-2" style={{ borderColor: '#FFCC00' }}>
          <CardHeader className="pb-4" style={{ backgroundColor: 'rgba(153, 0, 0, 0.05)' }}>
            <CardTitle className="text-xl font-bold" style={{ color: '#990000' }}>
              Credit Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Credits Completed - Read Only */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl" style={{ color: '#990000' }}>{totalCreditsTaken}</div>
                <p className="text-sm text-muted-foreground mt-1">Credits Completed</p>
              </div>

              {/* Program Target Credits - Editable */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                {isEditingTargetCredits ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      value={targetCreditsInput}
                      onChange={(e) => setTargetCreditsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTargetCreditsSave();
                        }
                      }}
                      className="text-center"
                      min="0"
                    />
                    <div className="flex gap-1 justify-center">
                      <Button onClick={handleTargetCreditsSave} size="sm">
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingTargetCredits(false)} size="sm">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl" style={{ color: '#FFCC00' }}>{targetCredits}</div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingTargetCredits(true)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">Program Target Credits</p>
              </div>

              {/* Scheduled Credits - Read Only */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl text-green-600">{currentEnrolledCredits}</div>
                <p className="text-sm text-muted-foreground mt-1">Scheduled Credits</p>
              </div>

              {/* Total Credits Required - Read Only */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl" style={{ color: totalCreditsRequired > 0 ? '#990000' : '#22c55e' }}>
                  {totalCreditsRequired}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Total Credits Required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorited Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Favorited Courses</CardTitle>
            <CardDescription>{favoritedCourses.length} courses saved</CardDescription>
          </CardHeader>
          <CardContent>
            {favoritedCourses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No favorited courses yet. Click the heart icon on any course to save it!</p>
            ) : (
              <div className="grid gap-3">
                {favoritedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onCourseSelect(course)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        <h4>{course.code}</h4>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{course.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.professor} • {course.credits} credits
                      </p>
                    </div>
                    <Badge variant="secondary">
                      ⭐ {course.rating.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course History - Moved to bottom */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course History</CardTitle>
                <CardDescription>{courseHistory.length} courses completed</CardDescription>
              </div>
              <Button
                onClick={() => setShowCourseSelector(!showCourseSelector)}
                className="flex items-center gap-2"
                style={{ backgroundColor: '#990000', color: 'white' }}
              >
                <Plus className="h-4 w-4" />
                Add Completed Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Course Selector */}
            {showCourseSelector && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Select courses you've completed:</h4>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCourseSelector(false);
                      setCourseSearchQuery('');
                    }}
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses by code, title, or professor..."
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {availableCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-white cursor-pointer transition-colors"
                      onClick={() => {
                        if (onAddCompletedCourse) {
                          onAddCompletedCourse(course);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-lg">{course.code}</span>
                          <Badge variant="secondary" className="text-xs">{course.credits} credits</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground">Prof. {course.professor}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="ml-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddCompletedCourse) {
                            onAddCompletedCourse(course);
                          }
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                  {availableCourses.length === 0 && courseSearchQuery === '' && (
                    <p className="text-muted-foreground text-center py-4">All available courses have been added to your history.</p>
                  )}
                  {availableCourses.length === 0 && courseSearchQuery !== '' && (
                    <p className="text-muted-foreground text-center py-4">No courses found matching "{courseSearchQuery}".</p>
                  )}
                </div>
              </div>
            )}

            {courseHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No course history yet. Add completed courses to track your progress!</p>
            ) : (
              <div className="space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-2">Course Code</th>
                        <th className="pb-2">Course Name</th>
                        <th className="pb-2">Professor</th>
                        <th className="pb-2 text-center">Credits</th>
                        <th className="pb-2 text-center">Review Status</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseHistory.map((item) => (
                        <tr 
                          key={item.course.id} 
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => onCourseSelect(item.course)}
                        >
                          <td className="py-3 font-medium">{item.course.code}</td>
                          <td className="py-3 text-sm text-muted-foreground">{item.course.title}</td>
                          <td className="py-3 text-sm text-muted-foreground">{item.course.professor}</td>
                          <td className="py-3 text-center font-medium">{item.course.credits}</td>
                          <td className="py-3 text-center">
                            {item.hasReview ? (
                              <Badge variant="secondary" className="text-xs">Reviewed</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Not Reviewed</Badge>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center gap-2">
                              {item.hasReview ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditReview(item.course);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit Review
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onWriteReview(item.course);
                                  }}
                                  style={{ backgroundColor: '#990000', color: 'white' }}
                                >
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Write Review
                                </Button>
                              )}
                              {onRemoveCompletedCourse && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveCompletedCourse(item.course.id);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remove from course history"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
