import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Type, 
  FileText, 
  Tag,
  Eye,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const CreateArticle: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Nutrition',
    imageURL: ''
  });

  const categories = ['Nutrition', 'Fitness', 'Mental Health', 'Prevention', 'Medical News'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (profile.role === 'patient') {
      setError("Only doctors and admins can create articles.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'articles'), {
        ...formData,
        authorId: user.uid,
        authorName: profile.fullName,
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        likes: [],
        comments: []
      });
      navigate('/articles');
    } catch (err) {
      console.error("Error creating article:", err);
      setError("Failed to create article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <Link 
            to="/articles" 
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 hover:border-neon-blue transition-all group shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-neon-blue transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] tracking-tight">Create New Article</h1>
            <p className="text-slate-500">Share your medical expertise with the community.</p>
          </div>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-neon-blue transition-all font-bold shadow-sm"
        >
          {previewMode ? <FileText className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          {previewMode ? 'Edit Content' : 'Preview Article'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {previewMode ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden"
          >
            <div className="h-64 w-full bg-slate-100 dark:bg-slate-900 relative">
              {formData.imageURL ? (
                <img src={formData.imageURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No Image Provided</div>
              )}
              <div className="absolute top-6 left-6 px-4 py-1 bg-neon-blue text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest">
                {formData.category}
              </div>
            </div>
            <div className="p-12 max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-8">{formData.title || 'Untitled Article'}</h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 italic mb-12 border-l-4 border-neon-blue pl-6">
                {formData.summary || 'No summary provided.'}
              </p>
              <div className="prose prose-lg dark:prose-invert max-w-none markdown-body">
                <ReactMarkdown>{formData.content || 'No content written yet.'}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    <Type className="w-4 h-4" />
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter a catchy title..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-xl font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Short Summary
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="A brief overview of the article..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Content (Markdown Supported)
                  </label>
                  <textarea
                    required
                    rows={15}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your article here. You can use Markdown for formatting..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    <Tag className="w-4 h-4" />
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all appearance-none font-bold"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4" />
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.imageURL}
                    onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-sm"
                  />
                  {formData.imageURL && (
                    <div className="mt-4 rounded-xl overflow-hidden h-32 border border-slate-100 dark:border-slate-700">
                      <img src={formData.imageURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2 neon-glow disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Publish Article
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Markdown Tips</h4>
                <ul className="text-xs text-slate-500 space-y-2">
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded"># Header</code> for H1</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">## Header</code> for H2</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">**Bold**</code> for bold text</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">- List item</code> for bullets</li>
                </ul>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateArticle;
