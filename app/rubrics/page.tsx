'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ChevronRight,
  Trash2,
  Edit,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import './rubrics.css';

// Interface for rubric data
type ClassLevel = 'Elementary' | 'Middle School' | 'High School' | 'University' | 'Graduate' | 'Professional';

interface RubricData {
  id?: number;
  key?: string;
  name: string;
  classLevel: ClassLevel;
  course: string;
  specialization: string;
  questions: string[];
  questionWeights?: number[];
  partialCreditEnabled?: boolean[];
  partialCreditCriteria?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface RubricListItem extends Omit<RubricData, 'questions'> {
  questionCount?: number;
  lastModified?: Date;
}

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<RubricData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    classLevels: ClassLevel[];
    courses: string[];
    dateRange: 'all' | 'lastWeek' | 'lastMonth' | 'lastYear';
  }>({
    classLevels: [],
    courses: [],
    dateRange: 'all'
  });
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  
  const [newRubric, setNewRubric] = useState<RubricData>({
    name: '',
    classLevel: 'High School',
    course: '',
    specialization: '',
    questions: [''],
    questionWeights: [10],
    partialCreditEnabled: [false],
    partialCreditCriteria: ['']
  });

  // Theme detection
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Refs for scroll functionality
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Load rubrics data from API
  useEffect(() => {
    fetchRubrics();
  }, []);
  
  // Extract available courses when rubrics load
  useEffect(() => {
    if (rubrics.length > 0) {
      const courses = Array.from(new Set(rubrics.map(r => r.course).filter(Boolean)));
      setAvailableCourses(courses);
    }
  }, [rubrics]);

  useEffect(() => {
    // Check if the document is available (client-side)
    if (typeof document !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setTheme(isDarkMode ? 'dark' : 'light');
      
      // Set up a mutation observer to watch for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setTheme(isDarkMode ? 'dark' : 'light');
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      // Clean up the observer on component unmount
      return () => observer.disconnect();
    }
  }, []);

  // Update data-theme attributes whenever theme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Update all elements that need theme awareness
      document.querySelectorAll(
        '.button-primary, .create-rubric-button, .rubrics-container, .search-input, .search-icon, .filter-button, .rubrics-table, .table-body, .table-header, table tr, table td, table th'
      ).forEach((element) => {
        element.setAttribute('data-theme', theme);
      });
    }
  }, [theme]);

  // Fetch rubrics from the API
  const fetchRubrics = async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      const response = await fetch('/api/rubrics');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rubrics');
      }
      
      const data = await response.json();
      setRubrics(data.rubrics || []);
    } catch (error) {
      console.error('Error fetching rubrics:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load rubrics');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to rubrics
  const filteredRubrics = rubrics.filter(rubric => {
    // First apply search query filter
    const matchesSearch = 
      rubric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rubric.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rubric.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then apply class level filter if selected
    if (filters.classLevels.length > 0 && !filters.classLevels.includes(rubric.classLevel)) {
      return false;
    }
    
    // Apply course filter if selected
    if (filters.courses.length > 0 && !filters.courses.includes(rubric.course)) {
      return false;
    }
    
    // Apply date range filter if selected
    if (filters.dateRange !== 'all' && rubric.updatedAt) {
      const updatedDate = new Date(rubric.updatedAt);
      const now = new Date();
      
      if (filters.dateRange === 'lastWeek') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (updatedDate < oneWeekAgo) return false;
      } else if (filters.dateRange === 'lastMonth') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        if (updatedDate < oneMonthAgo) return false;
      } else if (filters.dateRange === 'lastYear') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        if (updatedDate < oneYearAgo) return false;
      }
    }
    
    return true;
  });
  
  // Toggle class level filter
  const toggleClassLevelFilter = (level: ClassLevel) => {
    setFilters(prev => {
      const isSelected = prev.classLevels.includes(level);
      return {
        ...prev,
        classLevels: isSelected 
          ? prev.classLevels.filter(l => l !== level)
          : [...prev.classLevels, level]
      };
    });
  };
  
  // Toggle course filter
  const toggleCourseFilter = (course: string) => {
    setFilters(prev => {
      const isSelected = prev.courses.includes(course);
      return {
        ...prev,
        courses: isSelected 
          ? prev.courses.filter(c => c !== course)
          : [...prev.courses, course]
      };
    });
  };
  
  // Set date range filter
  const setDateRangeFilter = (range: 'all' | 'lastWeek' | 'lastMonth' | 'lastYear') => {
    setFilters(prev => ({
      ...prev,
      dateRange: range
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      classLevels: [],
      courses: [],
      dateRange: 'all'
    });
  };
  
  // Check if any filters are active
  const hasActiveFilters = filters.classLevels.length > 0 || 
                           filters.courses.length > 0 || 
                           filters.dateRange !== 'all';

  // Handle input changes for new rubric
  const handleInputChange = (field: keyof RubricData, value: string) => {
    setNewRubric(prev => ({ ...prev, [field]: value }));
  };

  // Handle question input changes
  const handleQuestionChange = (index: number, value: string) => {
    // Limit each question to 500 characters
    if (value.length > 500) {
      alert(`Questions are limited to 500 characters. This question has ${value.length} characters.`);
      return;
    }
    
    const updatedQuestions = [...newRubric.questions];
    updatedQuestions[index] = value;
    setNewRubric(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // Handle weight changes
  const handleWeightChange = (index: number, value: string) => {
    // Parse the value to a number, ensure it's between 1 and 100
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) numValue = 1;
    if (numValue > 100) numValue = 100;
    
    const updatedWeights = [...newRubric.questionWeights || []];
    updatedWeights[index] = numValue;
    
    setNewRubric(prev => ({
      ...prev,
      questionWeights: updatedWeights
    }));
  };

  // Handle partial credit toggle changes
  const handlePartialCreditToggle = (index: number, enabled: boolean) => {
    const updatedPartialCreditEnabled = [...(newRubric.partialCreditEnabled || [])];
    updatedPartialCreditEnabled[index] = enabled;
    
    setNewRubric(prev => ({
      ...prev,
      partialCreditEnabled: updatedPartialCreditEnabled
    }));
  };

  // Handle partial credit criteria changes
  const handlePartialCreditCriteriaChange = (index: number, criteria: string) => {
    const updatedPartialCreditCriteria = [...(newRubric.partialCreditCriteria || [])];
    updatedPartialCreditCriteria[index] = criteria;
    
    setNewRubric(prev => ({
      ...prev,
      partialCreditCriteria: updatedPartialCreditCriteria
    }));
  };

  // Optimized scroll to question function
  const scrollToQuestion = useCallback((questionIndex: number) => {
    // Use requestAnimationFrame for optimal performance
    requestAnimationFrame(() => {
      const questionElement = questionRefs.current[questionIndex];
      const container = questionsContainerRef.current;
      
      if (questionElement && container) {
        // Calculate the position to scroll to
        const containerRect = container.getBoundingClientRect();
        const questionRect = questionElement.getBoundingClientRect();
        
        // Check if element is already visible
        const isVisible = 
          questionRect.top >= containerRect.top && 
          questionRect.bottom <= containerRect.bottom;
        
        if (!isVisible) {
          // Scroll the element into view with smooth behavior
          questionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
        
        // Focus on the textarea for better UX
        setTimeout(() => {
          const textarea = questionElement.querySelector('textarea');
          if (textarea) {
            textarea.focus();
          }
        }, 300); // Wait for scroll animation to complete
      }
    });
  }, []);

  // Add new question field
  const addQuestion = () => {
    setNewRubric(prev => {
      // Check if the current questions are valid
      const allValid = prev.questions.every(q => q.trim().length > 0);
      
      if (!allValid) {
        alert('Please fill in all existing questions before adding a new one.');
        return prev;
      }
      
      const newQuestionIndex = prev.questions.length;
      
      // Update state first
      const updatedState = {
        ...prev,
        questions: [...prev.questions, ''],
        questionWeights: [...(prev.questionWeights || Array(prev.questions.length).fill(10)), 10],
        partialCreditEnabled: [...(prev.partialCreditEnabled || Array(prev.questions.length).fill(false)), false],
        partialCreditCriteria: [...(prev.partialCreditCriteria || Array(prev.questions.length).fill('')), '']
      };
      
      // Scroll to the new question after state update
      setTimeout(() => {
        scrollToQuestion(newQuestionIndex);
      }, 100); // Small delay to ensure DOM update
      
      return updatedState;
    });
  };

  // Remove question field
  const removeQuestion = (index: number) => {
    setNewRubric(prev => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions.splice(index, 1);
      
      const updatedWeights = [...(prev.questionWeights || [])];
      updatedWeights.splice(index, 1);
      
      const updatedPartialCreditEnabled = [...(prev.partialCreditEnabled || [])];
      updatedPartialCreditEnabled.splice(index, 1);
      
      const updatedPartialCreditCriteria = [...(prev.partialCreditCriteria || [])];
      updatedPartialCreditCriteria.splice(index, 1);
      
      // Clean up refs for removed questions to prevent memory leaks
      const newRefs: { [key: number]: HTMLDivElement | null } = {};
      Object.keys(questionRefs.current).forEach(key => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          // Keep refs for questions before the removed one
          newRefs[keyNum] = questionRefs.current[keyNum];
        } else if (keyNum > index) {
          // Shift refs for questions after the removed one
          newRefs[keyNum - 1] = questionRefs.current[keyNum];
        }
        // Skip the removed question's ref (keyNum === index)
      });
      questionRefs.current = newRefs;
      
      return {
        ...prev,
        questions: updatedQuestions,
        questionWeights: updatedWeights,
        partialCreditEnabled: updatedPartialCreditEnabled,
        partialCreditCriteria: updatedPartialCreditCriteria
      };
    });
  };

  // Submit rubric creation/update
  const handleSubmitRubric = async () => {
    // Validate all fields are completed
    if (
      !newRubric.name ||
      !newRubric.course ||
      !newRubric.specialization ||
      newRubric.questions.some(q => !q.trim())
    ) {
      alert('Please fill in all fields');
      return;
    }

    // Validate partial credit criteria when partial credit is enabled
    const partialCreditEnabled = newRubric.partialCreditEnabled || [];
    const partialCreditCriteria = newRubric.partialCreditCriteria || [];
    
    for (let i = 0; i < partialCreditEnabled.length; i++) {
      if (partialCreditEnabled[i] && !partialCreditCriteria[i]?.trim()) {
        alert(`Please provide partial credit criteria for question ${i + 1}, or disable partial credit for that question.`);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      let response;
      
      if (isEditing && selectedRubric?.key) {
        console.log('Updating existing rubric', {
          key: selectedRubric.key,
          oldName: selectedRubric.name,
          newName: newRubric.name
        });
        
        // Update existing rubric - pass the original key in the request body to maintain identity
        response = await fetch(`/api/rubrics/${encodeURIComponent(selectedRubric.key)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newRubric,
            originalKey: selectedRubric.key, // Include the original key to ensure we update the right record
            originalName: selectedRubric.name // Include the original name for comparison
          }),
        });
      } else {
        // Create new rubric
        response = await fetch('/api/rubrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRubric),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if error is due to maximum rubrics limit
        if (response.status === 403 && errorData.maxRubricLimitReached) {
          throw new Error(`You have reached the maximum limit of ${MAX_RUBRICS_PER_USER} rubrics. Please delete some existing rubrics before creating new ones.`);
        }
        
        throw new Error(errorData.error || 'Failed to save rubric');
      }
      
      // Refresh the rubrics list
      await fetchRubrics();
      
      // Reset form and close modal
      resetForm();
    } catch (error) {
      console.error('Error saving rubric:', error);
      alert(error instanceof Error ? error.message : 'Failed to save rubric');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form and modal state
  const resetForm = () => {
    setNewRubric({
      name: '',
      classLevel: 'High School',
      course: '',
      specialization: '',
      questions: [''],
      questionWeights: [10],
      partialCreditEnabled: [false],
      partialCreditCriteria: ['']
    });
    setCurrentStep(1);
    setIsCreateModalOpen(false);
    setSelectedRubric(null);
    setIsEditing(false);
    
    // Clean up all question refs when modal is closed
    questionRefs.current = {};
  };

  // Move to next step in creation flow
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1 && (!newRubric.name || !newRubric.classLevel)) {
      alert('Please fill in all fields');
      return;
    }
    if (currentStep === 2 && (!newRubric.course || !newRubric.specialization)) {
      alert('Please fill in all fields');
      return;
    }

    console.log(`Moving from step ${currentStep} to step ${currentStep + 1}`);
    setCurrentStep(prev => prev + 1);
  };

  // Move to previous step in creation flow
  const handlePrevStep = () => {
    console.log(`Moving from step ${currentStep} to step ${currentStep - 1}`);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Handle edit rubric
  const handleEditRubric = async (rubric: RubricListItem) => {
    try {
      setIsLoading(true);
      
      // Fetch the full rubric data including questions
      const response = await fetch(`/api/rubrics/${encodeURIComponent(rubric.key || '')}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rubric details');
      }
      
      const data = await response.json();
      const fullRubric = data.rubric;
      
      console.log('Editing rubric:', {
        key: fullRubric.key || rubric.key,
        name: fullRubric.name,
        questionCount: fullRubric.questions?.length
      });
      
      // Set the form data with the fetched rubric
      setNewRubric({
        name: fullRubric.name,
        classLevel: fullRubric.classLevel,
        course: fullRubric.course,
        specialization: fullRubric.specialization,
        questions: fullRubric.questions || [''],
        questionWeights: fullRubric.questionWeights || [10],
        partialCreditEnabled: fullRubric.partialCreditEnabled || Array(fullRubric.questions?.length || 1).fill(false),
        partialCreditCriteria: fullRubric.partialCreditCriteria || Array(fullRubric.questions?.length || 1).fill('')
      });
      
      // Set editing mode and selected rubric with original key and name
      setSelectedRubric({
        ...fullRubric,
        key: rubric.key, // Ensure we keep the original key
        name: fullRubric.name // Store the original name
      });
      setIsEditing(true);
      setIsCreateModalOpen(true);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error fetching rubric details:', error);
      alert(error instanceof Error ? error.message : 'Failed to load rubric details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete rubric
  const handleDeleteRubric = async (rubric: RubricListItem) => {
    if (!window.confirm('Are you sure you want to delete this rubric?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/rubrics/${encodeURIComponent(rubric.key || '')}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rubric');
      }
      
      // Refresh the rubrics list
      await fetchRubrics();
    } catch (error) {
      console.error('Error deleting rubric:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete rubric');
    } finally {
      setIsLoading(false);
    }
  };

  // Maximum number of rubrics allowed per user
  const MAX_RUBRICS_PER_USER = 20;

  // Check if user has reached maximum rubrics limit
  const hasReachedMaxRubrics = rubrics.length >= MAX_RUBRICS_PER_USER;

  return (
    <Layout activePage="rubrics">
      <div className="rubric-header-section" data-theme={theme}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center rubrics-title">
              <ClipboardList className="mr-2" size={24} />
              Rubrics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 rubrics-description">
              Create and manage grading rubrics for your assignments
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedRubric(null);
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className={`create-rubric-button ${hasReachedMaxRubrics ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasReachedMaxRubrics}
            title={hasReachedMaxRubrics ? `You have reached the maximum limit of ${MAX_RUBRICS_PER_USER} rubrics.` : ''}
            data-theme={theme}
          >
            <Plus size={18} className="mr-1" />
            Create Rubric
          </button>
        </div>

        {/* Maximum rubrics limit warning */}
        {hasReachedMaxRubrics && (
          <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Maximum Rubrics Limit Reached</p>
              <p className="text-sm">You have reached the maximum limit of {MAX_RUBRICS_PER_USER} rubrics. Please delete some existing rubrics before creating new ones.</p>
            </div>
          </div>
        )}
      </div>
      {/* Box 2: Search and Filters */}
      <div className="rubrics-container bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-4" data-theme={theme}>
        <div className="flex items-center gap-4">
          <div className="search-container relative flex-1">
            <div className="search-icon absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" data-theme={theme}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search rubrics..."
              className="search-input pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-theme={theme}
            />
          </div>
          <button 
            className={`filter-button ${hasActiveFilters ? 'filter-button-active' : ''} flex items-center px-4 py-2 border rounded-md transition-colors`}
            onClick={() => setIsFilterModalOpen(true)}
            data-theme={theme}
          >
            <SlidersHorizontal size={18} className="filter-icon mr-2" />
            {hasActiveFilters ? `Filters (${filters.classLevels.length + filters.courses.length + (filters.dateRange !== 'all' ? 1 : 0)})` : 'Filters'}
          </button>
        </div>
      </div>

      {/* Box 3: Rubrics Table */}
      <div className="rubrics-container bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6" data-theme={theme}>
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading rubrics...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load rubrics</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{loadError}</p>
            <button
              onClick={fetchRubrics}
              className="button button-primary"
              data-theme={theme}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Rubrics listing */}
        {!isLoading && !loadError && filteredRubrics.length > 0 && (
          <div className="table-container overflow-x-auto">
            <table className="rubrics-table min-w-full" data-theme={theme}>
              <thead className="table-header" data-theme={theme}>
                <tr>
                  <th className="table-head-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="table-head-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Class Level
                  </th>
                  <th className="table-head-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Course
                  </th>
                  <th className="table-head-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="table-head-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="table-head-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="table-body divide-y divide-gray-700" data-theme={theme}>
                {filteredRubrics.map((rubric) => (
                  <tr key={rubric.key} className="table-row" data-theme={theme}>
                    <td className="table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText size={18} className="assignment-icon mr-2" />
                        <div className="table-cell-name text-sm font-medium">{rubric.name}</div>
                      </div>
                    </td>
                    <td className="table-cell px-6 py-4 whitespace-nowrap text-sm">
                      {rubric.classLevel}
                    </td>
                    <td className="table-cell px-6 py-4 whitespace-nowrap text-sm">
                      {rubric.course}
                    </td>
                    <td className="table-cell px-6 py-4 whitespace-nowrap text-sm">
                      {rubric.specialization}
                    </td>
                    <td className="table-cell last-updated-column px-6 py-4 whitespace-nowrap text-sm">
                      {rubric.updatedAt ? new Date(rubric.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="table-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <button 
                          className="action-button"
                          title="Edit"
                          onClick={() => handleEditRubric(rubric)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="delete-button"
                          title="Delete"
                          onClick={() => handleDeleteRubric(rubric)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state - no rubrics */}
        {!isLoading && !loadError && filteredRubrics.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No rubrics found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'No rubrics match your search criteria.' : 'You haven\'t created any rubrics yet.'}
            </p>
            {!searchQuery && !hasReachedMaxRubrics && (
              <button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="button button-primary"
                data-theme={theme}
              >
                <Plus size={18} className="mr-1" />
                Create Your First Rubric
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {isFilterModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="modal-container bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="modal-header flex justify-between items-center mb-4">
                <h2 className="modal-title text-xl font-bold text-gray-900 dark:text-white">Filter Rubrics</h2>
                <button 
                  className="close-button text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setIsFilterModalOpen(false)}
                  aria-label="Close filter modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Class Level Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class Level</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Elementary', 'Middle School', 'High School', 'University', 'Graduate', 'Professional'].map((level) => (
                    <div 
                      key={level}
                      className={`px-3 py-2 rounded-md cursor-pointer text-sm transition-colors flex items-center
                        ${filters.classLevels.includes(level as ClassLevel)
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                      onClick={() => toggleClassLevelFilter(level as ClassLevel)}
                    >
                      <input 
                        type="checkbox" 
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={filters.classLevels.includes(level as ClassLevel)}
                        onChange={() => {}} // Handled by parent click
                      />
                      {level}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Course Filter */}
              {availableCourses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {availableCourses.map((course) => (
                      <div 
                        key={course}
                        className={`px-3 py-2 rounded-md cursor-pointer text-sm transition-colors mb-1 flex items-center
                          ${filters.courses.includes(course)
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                        onClick={() => toggleCourseFilter(course)}
                      >
                        <input 
                          type="checkbox" 
                          className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={filters.courses.includes(course)}
                          onChange={() => {}} // Handled by parent click
                        />
                        {course}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Date Range Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'lastWeek', label: 'Last Week' },
                    { value: 'lastMonth', label: 'Last Month' },
                    { value: 'lastYear', label: 'Last Year' }
                  ].map((option) => (
                    <div 
                      key={option.value}
                      className={`px-3 py-2 rounded-md cursor-pointer text-sm transition-colors flex items-center
                        ${filters.dateRange === option.value
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                      onClick={() => setDateRangeFilter(option.value as 'all' | 'lastWeek' | 'lastMonth' | 'lastYear')}
                    >
                      <input 
                        type="radio" 
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        checked={filters.dateRange === option.value}
                        onChange={() => {}} // Handled by parent click
                      />
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Filter Actions */}
              <div className="flex justify-center">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Rubric Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="modal-container bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md md:max-w-lg"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
          >
            <div className="p-6">
              <div className="modal-header flex justify-between items-center mb-4">
                <h2 className="modal-title text-xl font-bold text-gray-900 dark:text-white">
                  {isEditing && currentStep === 1 && "Edit Rubric - Basic Information"}
                  {isEditing && currentStep === 2 && "Edit Rubric - Course Information"}
                  {isEditing && currentStep === 3 && "Edit Rubric - Questions"}
                  {!isEditing && currentStep === 1 && "Create New Rubric"}
                  {!isEditing && currentStep === 2 && "Course Information"}
                  {!isEditing && currentStep === 3 && "Rubric Questions"}
                </h2>
                <button 
                  className="close-button text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  onClick={resetForm}
                  aria-label="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex justify-center items-center mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className={`flex items-center justify-center h-8 w-8 rounded-full cursor-pointer transition-colors
                        ${currentStep >= step 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      onClick={() => {
                        // Only allow moving to steps we've already visited or the next one
                        if (step <= currentStep || step === currentStep + 1) {
                          // Validate current step before allowing navigation
                          let canProceed = true;
                          
                          // Validate step 1 - Basic Information
                          if (currentStep === 1 && step > currentStep) {
                            if (!newRubric.name || !newRubric.classLevel) {
                              alert('Please fill in all fields in the Basic Information step first');
                              canProceed = false;
                            }
                          }
                          
                          // Validate step 2 - Course Information
                          if (currentStep === 2 && step > currentStep) {
                            if (!newRubric.course || !newRubric.specialization) {
                              alert('Please fill in all fields in the Course Information step first');
                              canProceed = false;
                            }
                          }
                          
                          // Log for debugging
                          console.log(`Attempting to move to step ${step} from step ${currentStep}, canProceed: ${canProceed}`);
                          
                          if (canProceed) {
                            setCurrentStep(step);
                          }
                        }
                      }}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`h-1 w-12 ${
                        currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <div className="mb-4">
                    <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rubric Name
                    </label>
                    <input
                      type="text"
                      className="form-input w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Essay Writing Rubric"
                      value={newRubric.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class Level
                    </label>
                    <select
                      className="form-select w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newRubric.classLevel}
                      onChange={(e) => handleInputChange('classLevel', e.target.value as ClassLevel)}
                    >
                      <option value="Elementary">Elementary</option>
                      <option value="Middle School">Middle School</option>
                      <option value="High School">High School</option>
                      <option value="University">University</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Course Information */}
              {currentStep === 2 && (
                <div>
                  <div className="mb-4">
                    <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course/Subject
                    </label>
                    <input
                      type="text"
                      className="form-input w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., English, Computer Science"
                      value={newRubric.course}
                      onChange={(e) => handleInputChange('course', e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Specialization/Topic
                    </label>
                    <input
                      type="text"
                      className="form-input w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Essay Writing, Algorithms"
                      value={newRubric.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Rubric Questions */}
              {currentStep === 3 && (
                <div>
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Add questions or criteria for your rubric. These will be used to evaluate assignments.
                  </p>
                  <div ref={questionsContainerRef} className="max-h-[300px] overflow-y-auto pr-2">
                    {newRubric.questions.map((question, index) => (
                      <div 
                        key={index} 
                        ref={(el) => { questionRefs.current[index] = el; }}
                        className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg" 
                        style={{ backgroundColor: 'var(--card-bg)' }}
                      >
                        <div className="flex items-start">
                          <div className="flex-grow">
                            <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Question/Criteria {index + 1}
                            </label>
                            <div className="flex space-x-2 mb-3">
                              <div className="flex-grow">
                                <textarea
                                  className="question-textarea form-textarea w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="e.g., How well does the essay address the prompt?"
                                  rows={2}
                                  value={question}
                                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                                  maxLength={500}
                                />
                                <div className="text-xs text-gray-500 mt-1 text-right">
                                  {question.length}/500 characters
                                </div>
                              </div>
                              <div className="w-24">
                                <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Weight
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  value={newRubric.questionWeights?.[index] || 10}
                                  onChange={(e) => handleWeightChange(index, e.target.value)}
                                />
                                <div className="text-xs text-gray-500 mt-1 text-center">
                                  Points
                                </div>
                              </div>
                            </div>
                            
                            {/* Partial Credit Section */}
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id={`partial-credit-${index}`}
                                  checked={newRubric.partialCreditEnabled?.[index] || false}
                                  onChange={(e) => handlePartialCreditToggle(index, e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`partial-credit-${index}`} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Enable Partial Credit
                                </label>
                              </div>
                              {newRubric.partialCreditEnabled?.[index] && (
                                <div className="mt-2">
                                  <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Partial Credit Criteria
                                  </label>
                                  <textarea
                                    className="question-textarea form-textarea w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., Award 50% if student addresses prompt but lacks supporting evidence"
                                    rows={2}
                                    value={newRubric.partialCreditCriteria?.[index] || ''}
                                    onChange={(e) => handlePartialCreditCriteriaChange(index, e.target.value)}
                                    maxLength={500}
                                  />
                                  <div className="text-xs text-gray-500 mt-1 text-right">
                                    {(newRubric.partialCreditCriteria?.[index] || '').length}/500 characters
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {newRubric.questions.length > 1 && (
                            <button
                              className="ml-2 mt-6 text-red-500 hover:text-red-700 transition-colors"
                              onClick={() => removeQuestion(index)}
                              aria-label="Remove question"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="add-question-button flex items-center text-sm font-medium"
                    onClick={addQuestion}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Another Question
                  </button>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                {currentStep > 1 ? (
                  <button
                    className="button button-secondary px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    data-theme={theme}
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}
                
                {isEditing ? (
                  <button
                    className={`button button-primary px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center disabled:opacity-50 transition-colors
                      ${currentStep < 3 ? 'ml-auto' : ''}`}
                    onClick={currentStep < 3 ? handleNextStep : handleSubmitRubric}
                    disabled={isSubmitting}
                    data-theme={theme}
                  >
                    {isSubmitting && currentStep === 3 ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : currentStep < 3 ? (
                      <>
                        Next 
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                ) : (
                  <button
                    className="button button-primary px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center disabled:opacity-50 transition-colors ml-auto"
                    onClick={currentStep < 3 ? handleNextStep : handleSubmitRubric}
                    disabled={isSubmitting}
                    data-theme={theme}
                  >
                    {isSubmitting && currentStep === 3 ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : currentStep < 3 ? (
                      <>
                        Next 
                        <ChevronRight size={16} className="ml-1" />
                      </>
                    ) : (
                      'Create Rubric'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 