import ArticleWizard from '../components/article-wizard/ArticleWizard';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* The ArticleWizard component will be placed here in the next task */}
        <ArticleWizard />
      </div>
    </main>
  );
}
