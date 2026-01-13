/**
 * Workspace Creation Loader
 * Fullscreen cinematic loading experience for workspace creation
 * Shows staged progress with descriptive steps while API processes
 */

import React, { useState, useEffect, useCallback } from 'react';

interface CreationStep {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CREATION_STEPS: CreationStep[] = [
  {
    id: 1,
    label: 'Initializing Workspace',
    description: 'Setting up your secure workspace environment...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 2,
    label: 'Extracting Clauses',
    description: 'AI is parsing and extracting contract clauses...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 3,
    label: 'Mapping Variables',
    description: 'Identifying financial terms and key variables...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: 4,
    label: 'Building Dependency Graph',
    description: 'Creating logical relationships between clauses...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 5,
    label: 'Generating Graph Nodes',
    description: 'Creating visual nodes from extracted data...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: 6,
    label: 'Analyzing Covenants',
    description: 'Detecting and classifying covenant structures...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 7,
    label: 'Computing Integrity Score',
    description: 'Calculating document integrity metrics...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 8,
    label: 'Preparing Golden Record',
    description: 'Establishing baseline for drift detection...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 9,
    label: 'Finalizing Setup',
    description: 'Completing workspace configuration...',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

// Total animation duration in ms (10 seconds to reach ~95%)
const ANIMATION_DURATION = 10000;
// Time per step (distributes 10s across 9 steps, with last step waiting for API)
const STEP_DURATION = ANIMATION_DURATION / (CREATION_STEPS.length - 1);

interface WorkspaceCreationLoaderProps {
  isVisible: boolean;
  workspaceName: string;
  isApiComplete: boolean;
  isSuccess: boolean;
  onComplete: () => void;
  errorMessage?: string;
}

export const WorkspaceCreationLoader: React.FC<WorkspaceCreationLoaderProps> = ({
  isVisible,
  workspaceName,
  isApiComplete,
  isSuccess,
  onComplete,
  errorMessage,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Reset state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setShowSuccess(false);
      setShowError(false);
    }
  }, [isVisible]);

  // Progress animation - runs for 10 seconds to reach ~95%
  useEffect(() => {
    if (!isVisible || showSuccess || showError) return;

    const startTime = Date.now();
    const maxProgressBeforeApi = 95; // Stop at 95% until API completes

    const animationFrame = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = (elapsed / ANIMATION_DURATION) * maxProgressBeforeApi;
      
      // Calculate current step based on time
      const stepIndex = Math.min(
        Math.floor(elapsed / STEP_DURATION),
        CREATION_STEPS.length - 2 // Stop at second-to-last step until API
      );

      if (rawProgress < maxProgressBeforeApi) {
        setProgress(rawProgress);
        setCurrentStep(stepIndex);
        requestAnimationFrame(animationFrame);
      } else {
        // We've reached 95%, now we wait for API
        setProgress(maxProgressBeforeApi);
        setCurrentStep(CREATION_STEPS.length - 2); // Second to last step
      }
    };

    const frameId = requestAnimationFrame(animationFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, showSuccess, showError]);

  // Handle API completion
  useEffect(() => {
    if (!isVisible || !isApiComplete) return;

    if (isSuccess) {
      // Complete the progress bar and show success
      setProgress(100);
      setCurrentStep(CREATION_STEPS.length - 1);
      
      // Show success screen after brief delay
      const successTimer = setTimeout(() => {
        setShowSuccess(true);
      }, 500);

      // Auto-close after success display
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => {
        clearTimeout(successTimer);
        clearTimeout(completeTimer);
      };
    } else {
      // Show error state
      setShowError(true);
      
      // Auto-close after error display
      const errorTimer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => clearTimeout(errorTimer);
    }
  }, [isVisible, isApiComplete, isSuccess, onComplete]);

  const handleManualClose = useCallback(() => {
    if (showError) {
      onComplete();
    }
  }, [showError, onComplete]);

  if (!isVisible) return null;

  const currentStepData = CREATION_STEPS[currentStep] || CREATION_STEPS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-8">
        {/* Success Screen */}
        {showSuccess ? (
          <div className="text-center workspace-creation-success">
            {/* Success Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30">
                  <svg className="w-12 h-12 text-white success-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Success Text */}
            <h2 className="mb-3 text-3xl font-bold text-white">
              Workspace Created Successfully!
            </h2>
            <p className="mb-2 text-xl font-semibold text-green-400">
              {workspaceName}
            </p>
            <p className="text-slate-400">
              Your workspace is ready. Redirecting to dashboard...
            </p>

            {/* Animated dots */}
            <div className="flex justify-center gap-1 mt-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : showError ? (
          /* Error Screen */
          <div className="text-center workspace-creation-error">
            {/* Error Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            {/* Error Text */}
            <h2 className="mb-3 text-3xl font-bold text-white">
              Creation Failed
            </h2>
            <p className="mb-4 text-lg text-red-400">
              {errorMessage || 'An unexpected error occurred'}
            </p>
            <p className="mb-6 text-slate-400">
              Please try again or contact support if the issue persists.
            </p>

            <button
              onClick={handleManualClose}
              className="px-6 py-2 text-white transition-colors rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        ) : (
          /* Loading Screen */
          <div className="workspace-creation-loader">
            {/* Header */}
            <div className="mb-10 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">
                Creating Your Workspace
              </h2>
              <p className="text-lg text-slate-400">
                {workspaceName}
              </p>
            </div>

            {/* Current Step Display */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center justify-center text-white shadow-lg w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-500/30 step-icon-pulse">
                {currentStepData.icon}
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-white">
                  {currentStepData.label}
                </p>
                <p className="text-sm text-slate-400">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-6">
              <div className="h-3 overflow-hidden rounded-full bg-slate-700/50 backdrop-blur">
                <div
                  className="h-full transition-all duration-300 ease-out rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-emerald-400 progress-bar-glow"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-500">Initializing</span>
                <span className="text-sm font-medium text-primary-400">
                  {Math.round(progress)}%
                </span>
                <span className="text-xs text-slate-500">Complete</span>
              </div>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex justify-between px-2">
              {CREATION_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    index <= currentStep ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-400 scale-100'
                        : index === currentStep
                        ? 'bg-primary-400 scale-125 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Fun fact / tip */}
            <div className="mt-10 text-center">
              <p className="text-xs italic text-slate-500">
                💡 LMA Nexus uses AI to automatically extract and link contract clauses
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceCreationLoader;
