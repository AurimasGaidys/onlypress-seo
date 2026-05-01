// src/components/god-mode/GodMode.tsx
'use client';

import { useState } from 'react';
import SimpleEditor from './SimpleEditor';

export default function GodMode() {
  const [formData, setFormData] = useState({
    topic: '',
    title: '',
    keywords: [] as string[],
    seoMetaDescription: '',
    articleConfig: { length: 'medium', tone: 'professional' },
    advancedSettings: {},
    editorContent: '',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">God Mode</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[700px]">
          <div className="space-y-8">
          {/* Section 1: AI Article Generator */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AI Article Generator</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">Upload Document</span>
                </div>
              </button>
              <button
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors"
                onClick={() => {
                  const triggerButton = document.getElementById('create-manually-trigger');
                  if (triggerButton) triggerButton.click();
                }}
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Create Manually</span>
                </div>
              </button>
            </div>
            {/* Hidden button to trigger manual creation via its onClick */}
            <button
              className="hidden"
              id="create-manually-trigger"
              onClick={async () => {
                if (!formData.topic.trim()) {
                  alert("Please enter a topic first.");
                  return;
                }
                try {
                  const response = await fetch('/api/generate-titles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: formData.topic }),
                  });
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch titles');
                  }
                  const data = await response.json();
                  if (!data.titles || data.titles.length === 0) {
                    throw new Error("AI returned no titles. Please try a different topic.");
                  }
                  // For now, just set the first generated title
                  setFormData({ ...formData, title: data.titles[0] });
                  // TODO: Implement logic to present all generated titles to the user for selection
                } catch (error) {
                  console.error("Error generating title:", error);
                  alert(`Error generating title: ${(error as Error).message}`);
                }
              }}
            />
          </div>

          {/* Section 2: Article Creation */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Article Creation</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium mb-1">Topic</label>
                <input
                  id="topic"
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter the main topic..."
                />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter the article title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keywords</label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.keywords.join(', ')} // Display keywords as a comma-separated string
                    onChange={(e) => {
                      // Split the input string by comma and trim whitespace to get individual keywords
                      const newKeywords = e.target.value.split(',').map(k => k.trim()).filter(k => k !== '');
                      setFormData({...formData, keywords: newKeywords});
                    }}
                    className="flex-1 p-2 border-input rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add keywords, separated by commas..."
                  />
                  {/* The "Add" button is no longer needed as we parse the input field directly */}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm">
                      {keyword}
                      <button
                        onClick={() => {
                          const newKeywords = [...formData.keywords];
                          newKeywords.splice(index, 1);
                          setFormData({...formData, keywords: newKeywords});
                        }}
                        className="text-destructive hover:text-destructive/90"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="seoMetaDescription" className="block text-sm font-medium mb-1">SEO Meta Description</label>
                <textarea
                  id="seoMetaDescription"
                  value={formData.seoMetaDescription}
                  onChange={(e) => setFormData({...formData, seoMetaDescription: e.target.value})}
                  className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter the SEO meta description..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Configuration */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="space-y-6">
              {/* Article Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Article Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Length</label>
                    <div className="flex flex-wrap gap-2">
                      {['short', 'medium', 'long'].map((length) => (
                        <label key={length} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="length"
                            checked={formData.articleConfig.length === length}
                            onChange={() => setFormData({
                              ...formData,
                              articleConfig: { ...formData.articleConfig, length }
                            })}
                            className="mr-2"
                          />
                          {length.charAt(0).toUpperCase() + length.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tone</label>
                    <div className="flex flex-wrap gap-2">
                      {['professional', 'casual', 'formal'].map((tone) => (
                        <label key={tone} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="tone"
                            checked={formData.articleConfig.tone === tone}
                            onChange={() => setFormData({
                              ...formData,
                              articleConfig: { ...formData.articleConfig, tone }
                            })}
                            className="mr-2"
                          />
                          {tone.charAt(0).toUpperCase() + tone.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Advanced Settings</h3>
                <div className="space-y-2">
                  {/* Placeholder for Advanced Settings controls */}
                  <p className="text-sm text-muted-foreground">Advanced settings controls will be added here.</p>
                  {/* Example: Switch for AI creativity */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">AI Creativity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value="50" // Placeholder value
                      onChange={() => {}} // Placeholder handler
                      className="w-1/2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Include Sources</label>
                    <input
                      type="checkbox"
                      checked={false} // Placeholder value
                      onChange={() => {}} // Placeholder handler
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="space-y-8">
          {/* Section 4: Article Editor */}
          <div className="bg-card p-6 rounded-lg shadow h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Article Editor</h2>
            <div className="flex-grow">
              <SimpleEditor
                content={formData.editorContent}
                onChange={(newContent) => setFormData({...formData, editorContent: newContent})}
              />
            </div>
          </div>

          {/* Section 5: Generate Heading Images */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Generate Heading Images</h2>
            <div className="space-y-4">
              <button className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
                      onClick={() => { alert('TODO: Generate images for all headings'); }}>
                Generate Images for All Headings
              </button>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {/* Placeholder for heading list */}
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Introduction</span>
                    <button className="text-sm text-primary hover:underline">Generate Image</button>
                  </div>
                </div>
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Main Concept</span>
                    <button className="text-sm text-primary hover:underline">Generate Image</button>
                  </div>
                </div>
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Conclusion</span>
                    <button className="text-sm text-primary hover:underline">Generate Image</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: SEO Analysis */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">SEO Analysis</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium">Keyword Density</h3>
                  <p className="text-2xl font-bold mt-1">2.3%</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium">Readability</h3>
                  <p className="text-2xl font-bold mt-1">Good</p>
                </div>
               </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-medium">Suggestions</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Consider adding more internal links.</li>
                  <li>Optimize meta description length (currently 150/160 characters).</li>
                  <li>Add more subheadings (H2, H3) for better structure.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 7: Article Download */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Article Download</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
                      onClick={() => { alert('TODO: Download HTML'); }}>
                Download HTML
              </button>
              <button className="bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
                      onClick={() => { alert('TODO: Download Markdown'); }}>
                Download Markdown
              </button>
              <button className="bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
                      onClick={() => { alert('TODO: Download PDF'); }}>
                Download PDF
              </button>
            </div>
          </div>

          {/* Section 8: Article Publication */}
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Article Publication</h2>
            <div className="space-y-6">
              {/* Advanced Filters */}
              <div>
                <h3 className="text-lg font-medium mb-3">Advanced Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>All Categories</option>
                      <option>Technology</option>
                      <option>Science</option>
                      <option>Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Audience</label>
                    <select className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>All Audiences</option>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Publisher List */}
              <div>
                <h3 className="text-lg font-medium mb-3">Publishers</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <span>Medium</span>
                    <button className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors"
                            onClick={() => { alert('TODO: Publish to Medium'); }}>
                      Publish
                    </button>
                  </div>
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <span>Dev.to</span>
                    <button className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors"
                            onClick={() => { alert('TODO: Publish to Dev.to'); }}>
                      Publish
                    </button>
                  </div>
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <span>Personal Blog</span>
                    <button className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors"
                            onClick={() => { alert('TODO: Publish to Personal Blog'); }}>
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
