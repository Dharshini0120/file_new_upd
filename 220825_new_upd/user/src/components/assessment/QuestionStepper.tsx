import React, { useEffect, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface QuestionStepperProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  answeredQuestions: Set<number>;
  sectionName: string;
  onQuestionClick: (questionIndex: number) => void;
}

const QuestionStepper: React.FC<QuestionStepperProps> = ({
  totalQuestions,
  currentQuestionIndex,
  answeredQuestions,
  sectionName,
  onQuestionClick
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentDotRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current question when it changes
  useEffect(() => {
    if (scrollContainerRef.current && currentDotRef.current) {
      const container = scrollContainerRef.current;
      const dot = currentDotRef.current;

      const containerRect = container.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();

      // Check if dot is outside visible area
      if (dotRect.left < containerRect.left || dotRect.right > containerRect.right) {
        // Calculate scroll position to center the dot
        const scrollLeft = dot.offsetLeft - container.offsetWidth / 2 + dot.offsetWidth / 2;
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [currentQuestionIndex]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const getStepStyles = (index: number) => {
    if (index === currentQuestionIndex) {
      // Current question: black circle
      return {
        backgroundColor: '#000000',
        color: '#ffffff',
        width: 28,
        height: 28,
        fontSize: '12px',
        fontWeight: 'bold'
      };
    } else if (answeredQuestions.has(index)) {
      // Answered question: blue circle
      return {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        width: 24,
        height: 24,
        fontSize: '11px',
        fontWeight: '600'
      };
    } else {
      // Unanswered question: grey circle
      return {
        backgroundColor: '#d1d5db',
        color: '#6b7280',
        width: 24,
        height: 24,
        fontSize: '11px',
        fontWeight: '600'
      };
    }
  };

  return (
    <Box sx={{ mb: 3, display: 'none' }}>
      {/* Section info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {sectionName}
        </Typography>
      </Box>

      {/* Stepper with navigation arrows */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left scroll arrow */}
        <IconButton
          onClick={scrollLeft}
          sx={{
            position: 'absolute',
            left: -8,
            zIndex: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            }
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 20, color: '#6b7280' }} />
        </IconButton>

        {/* Horizontally scrollable stepper */}
        <Box
          ref={scrollContainerRef}
          sx={{
            position: 'relative',
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 1,
            mx: 2,
            '&::-webkit-scrollbar': {
              height: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#cbd5e1',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#94a3b8',
              },
            },
          }}
        >
          {/* Stepper content with minimum width for scrolling */}
          <Box sx={{
            position: 'relative',
            minWidth: `${Math.max(totalQuestions * 40, 800)}px`,
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            px: 3
          }}>
            {/* Background dashed line */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '30px',
                right: '30px',
                height: '2px',
                background: `repeating-linear-gradient(
                  to right,
                  #d1d5db 0px,
                  #d1d5db 4px,
                  transparent 4px,
                  transparent 8px
                )`,
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            />

            {/* Solid blue progress line */}
            {currentQuestionIndex > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '30px',
                  width: `calc(${(currentQuestionIndex / Math.max(totalQuestions - 1, 1)) * 100}% - 30px)`,
                  height: '4px',
                  backgroundColor: '#3b82f6',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  borderRadius: '2px'
                }}
              />
            )}

            {/* Question dots */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 3,
              width: '100%',
              px: '16px'
            }}>
              {Array.from({ length: totalQuestions }, (_, index) => {
                const stepStyles = getStepStyles(index);
                return (
                  <Box
                    key={index}
                    ref={index === currentQuestionIndex ? currentDotRef : null}
                    onClick={() => onQuestionClick(index)}
                    sx={{
                      width: stepStyles.width,
                      height: stepStyles.height,
                      borderRadius: '50%',
                      backgroundColor: stepStyles.backgroundColor,
                      color: stepStyles.color,
                      fontSize: stepStyles.fontSize,
                      fontWeight: stepStyles.fontWeight,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
                      },
                      '&:active': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {index + 1}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Right scroll arrow */}
        <IconButton
          onClick={scrollRight}
          sx={{
            position: 'absolute',
            right: -8,
            zIndex: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            }
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 20, color: '#6b7280' }} />
        </IconButton>
      </Box>

      {/* Progress text */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#6b7280',
            fontSize: '12px'
          }}
        >
          {answeredQuestions.size} of {totalQuestions} questions answered
        </Typography>
      </Box>
    </Box>
  );
};

export default QuestionStepper;
