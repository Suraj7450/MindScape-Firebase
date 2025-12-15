'use client';

import { useEffect, useState } from 'react';
import LoginVariantA from './layouts/variant-a';
import LoginVariantB from './layouts/variant-b';
import LoginVariantC from './layouts/variant-c';
import LoginVariantD from './layouts/variant-d';
import LoginVariantE from './layouts/variant-e';
import { Loader2 } from 'lucide-react';

const VARIANTS = [
  LoginVariantA,
  LoginVariantB,
  LoginVariantC,
  LoginVariantD,
  LoginVariantE,
];

export default function LoginPage() {
  const [Variant, setVariant] = useState<null | (() => JSX.Element)>(null);

  useEffect(() => {
    // Select random variant on client-side mount to avoid hydration mismatch
    const randomIndex = Math.floor(Math.random() * VARIANTS.length);
    setVariant(() => VARIANTS[randomIndex]);
  }, []);

  if (!Variant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return <Variant />;
}
