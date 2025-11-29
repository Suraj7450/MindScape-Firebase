
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to merge Tailwind CSS classes with clsx.
 * @param {...ClassValue[]} inputs - An array of class values.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a block of text, converting markdown-style syntax to HTML.
 * This version properly handles paragraphs, lists, and other structures.
 * @param {string} text - The block of text to format.
 * @returns {string} A string containing the formatted HTML.
 */
export const formatText = (text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (const line of lines) {
    let processedLine = line.trim();

    // Handle headings
    if (processedLine.startsWith('#')) {
      if (inList) {
        html += `</${listType}>`;
        inList = false;
      }
      let level = processedLine.match(/^#+/)![0].length;
      let content = processedLine.substring(level).trim();
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<h${level}>${content}</h${level}>`;
      continue;
    }
    
    // Handle bold text within any line
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Handle list items
    const isUnorderedListItem = /^\s*([*-])\s+/.test(line);
    const isOrderedListItem = /^\s*\d+\.\s+/.test(line);

    if (isUnorderedListItem || isOrderedListItem) {
      const currentListType = isUnorderedListItem ? 'ul' : 'ol';
      if (!inList) {
        inList = true;
        listType = currentListType;
        html += `<${listType}>`;
      } else if (listType !== currentListType) {
        // Switch list type
        html += `</${listType}><${currentListType}>`;
        listType = currentListType;
      }
      
      const listItemContent = line.replace(/^\s*([*-]|\d+\.)\s+/, '').trim();
      html += `<li>${listItemContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;

    } else {
      if (inList) {
        html += `</${listType}>`;
        inList = false;
      }
      // Handle paragraphs
      if (processedLine) {
        html += `<p>${processedLine}</p>`;
      }
    }
  }

  if (inList) {
    html += `</${listType}>`;
  }
  
  // Clean up any empty paragraphs that might have been created from newlines
  return html.replace(/<p><\/p>/g, '');
};

/**
 * Formats a date into a short, relative time string (e.g., "5m", "2h", "3d").
 * @param {Date} date - The date to format.
 * @returns {string} The formatted short time string.
 */
export function formatShortDistanceToNow(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return '1m'; // Show 1m for anything under a minute
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo`;
  }
  const years = Math.floor(days / 365);
  return `${years}y`;
}
