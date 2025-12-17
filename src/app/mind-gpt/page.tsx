'use client';

import { Suspense } from 'react';
import { AppSidebar } from '@/components/mind-gpt/app-sidebar';
import { ChatInterface } from '@/components/mind-gpt/chat-interface';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { GenerationLoading } from '@/components/generation-loading';

function MindGptPageContent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ChatInterface />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MindGptPage() {
  return (
    <Suspense fallback={<GenerationLoading />}>
      <MindGptPageContent />
    </Suspense>
  );
}
