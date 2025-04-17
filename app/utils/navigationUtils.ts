'use client';

/**
 * Custom navigation function that triggers transition animations
 * before actually navigating to the new page
 * 
 * @param path The path to navigate to
 */
export const navigateWithTransition = (path: string) => {
  // Create and dispatch custom event immediately
  const event = new CustomEvent('beforePageChange', {
    detail: { nextPath: path }
  });
  
  window.dispatchEvent(event);
  
  // Navigate after a fixed duration - this ensures the animation
  // has enough time to run without pausing
  setTimeout(() => {
    window.location.href = path;
  }, 400); // Match this exactly with the animation duration in PageTransition
};