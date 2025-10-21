// src/app/new/page.tsx
import ArticleWizard from '@/components/article-wizard/ArticleWizard';

export default function NewDocumentPage() {
  return (
    <div>
      {/* The wizard itself provides the main UI, so we don't need much else here */}
      <ArticleWizard />
    </div>
  );
}
