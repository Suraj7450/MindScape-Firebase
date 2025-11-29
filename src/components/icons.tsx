
import type { LucideProps } from 'lucide-react';
import Image from 'next/image';

/**
 * A collection of custom icon components for the application.
 * This object allows for using images or custom SVGs as icons alongside the lucide-react library.
 * @property {function(Omit<LucideProps, 'ref'>): JSX.Element} logo - The application's logo component.
 */
export const Icons = {
  logo: (props: Omit<LucideProps, 'ref'>) => (
    <Image src="/MindScape-Logo.png" alt="MindScape Logo" width={28} height={28} {...props} />
  ),
  export: (props: Omit<LucideProps, 'ref'>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      <path d="M19 21H5" />
    </svg>
  ),
};
