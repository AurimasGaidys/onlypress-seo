// src/app/page.tsx
import ArticleWizard from '@/components/article-wizard/ArticleWizard';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <ArticleWizard />
      </div>
    </main>
  );
}
