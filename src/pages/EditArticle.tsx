import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Type, 
  Tag,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Article } from '../types';

const EditArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Nutrition',
    imageURL: ''
  });

  const categories = ['Nutrition', 'Fitness', 'Mental Health', 'Prevention', 'Medical News'];

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Article;
          
          // Check if user is authorized to edit
          if (user?.uid !== data.authorId) {
            navigate('/articles');
            return;
          }

          setFormData({
            title: data.title,
            summary: data.summary,
            content: data.content,
            category: data.category,
            imageURL: data.imageURL || ''
          });
        } else {
          navigate('/articles');
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article.");
      } finally {
        setLoading(false);
      }
    };

    if (user && profile) {
      fetchArticle();
    }
  }, [id, user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSaving(true);
    setError(null);

    try {
      const docRef = doc(db, 'articles', id);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
        lastUpdatedTimestamp: serverTimestamp()
      });
      navigate(`/articles/${id}`);
    } catch (err) {
      console.error("Error updating article:", err);
      setError("Failed to update article. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <Link 
            to={`/articles/${id}`} 
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 hover:border-neon-blue transition-all group shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-neon-blue transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] tracking-tight">Edit Article</h1>
            <p className="text-slate-500">Refine your medical expertise sharing.</p>
          </div>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-neon-blue transition-all font-bold shadow-sm"
        >
          {previewMode ? <FileText className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          {previewMode ? 'Edit Content' : 'Preview Changes'}
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
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <span className="px-3 py-1 bg-neon-blue text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">
                  {formData.category}
                </span>
                <h2 className="text-3xl font-bold text-white line-clamp-2">{formData.title || 'Untitled Article'}</h2>
              </div>
            </div>
            <div className="p-12 prose prose-lg dark:prose-invert max-w-none markdown-body">
              <ReactMarkdown>{formData.content || '*No content yet...*'}</ReactMarkdown>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="editor"
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
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Briefly describe what this article is about..."
                    rows={3}
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
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your article content here..."
                    rows={15}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all font-mono text-sm resize-none"
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
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4" />
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageURL}
                    onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-sm"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-neon-blue" />
                  Writing Tips
                </h3>
                <ul className="space-y-3 text-sm text-slate-400 list-disc pl-4">
                  <li>Use clear, concise headings</li>
                  <li>Include evidence-based information</li>
                  <li>Avoid overly technical jargon</li>
                  <li>Add a compelling cover image</li>
                  <li>Double-check your facts</li>
                </ul>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditArticle;
