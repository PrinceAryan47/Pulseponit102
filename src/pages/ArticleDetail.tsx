import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar,
  Share2,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  Trash2,
  Send,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { safeFormat } from '../lib/dateUtils';

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const docRef = doc(db, 'articles', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
      } else {
        // Fallback for mock data if needed, but usually we want real data here
        setLoading(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching article:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleLike = async () => {
    if (!user || !article || !id) return navigate('/login');
    
    const isLiked = article.likes?.includes(user.uid);
    const docRef = doc(db, 'articles', id);

    try {
      await updateDoc(docRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking article:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !commentText.trim() || !id) return;

    setIsSubmittingComment(true);
    try {
      const docRef = doc(db, 'articles', id);
      await updateDoc(docRef, {
        comments: arrayUnion({
          userId: user.uid,
          userName: profile.fullName,
          text: commentText.trim(),
          createdAt: new Date().toISOString()
        })
      });
      setCommentText('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteDoc(doc(db, 'articles', id));
      navigate('/articles');
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article.");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Article not found</h2>
        <Link to="/articles" className="text-neon-blue hover:underline">Back to Articles</Link>
      </div>
    );
  }

  const isLiked = user ? article.likes?.includes(user.uid) : false;

  return (
    <div className="bg-[rgb(var(--background))] min-h-screen transition-colors duration-300">
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full">
        <img 
          src={article.imageURL} 
          alt={article.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 lg:p-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <Link 
                  to="/articles" 
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Back to Articles
                </Link>
                <div className="flex items-center gap-2">
                  {(user?.uid === article.authorId) && (
                    <>
                      <Link 
                        to={`/articles/${id}/edit`}
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-sm"
                        title="Edit Article"
                      >
                        <Edit3 className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={handleDelete}
                        className="p-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all backdrop-blur-sm"
                        title="Delete Article"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <span className="px-4 py-1 bg-neon-blue text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">
                {article.category}
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-8 text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Author</p>
                    <p className="font-bold">{article.authorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Published</p>
                    <p className="font-bold">{safeFormat(article.createdAt, 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Read Time</p>
                    <p className="font-bold">5 min read</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg dark:prose-invert max-w-none markdown-body mb-16"
            >
              <ReactMarkdown>{article.content || article.summary}</ReactMarkdown>
            </motion.div>

            {/* Actions */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mb-16">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all group",
                    isLiked 
                      ? "bg-neon-blue text-slate-900 shadow-lg shadow-neon-blue/20" 
                      : "bg-slate-50 dark:bg-slate-800 hover:bg-neon-blue/10 hover:text-neon-blue"
                  )}
                >
                  <ThumbsUp className={cn("w-5 h-5 transition-transform", !isLiked && "group-hover:scale-110")} />
                  <span className="font-bold">{article.likes?.length || 0} Helpful</span>
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-neon-blue/10 hover:text-neon-blue transition-all group">
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">{article.comments?.length || 0} Comments</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-neon-blue/10 hover:text-neon-blue transition-all">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-neon-blue/10 hover:text-neon-blue transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold">Comments</h3>
              
              {user ? (
                <form onSubmit={handleAddComment} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] focus:ring-2 focus:ring-neon-blue outline-none transition-all resize-none shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="absolute bottom-4 right-4 p-3 bg-neon-blue text-slate-900 rounded-2xl hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 disabled:opacity-50"
                    >
                      {isSubmittingComment ? (
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-slate-500 mb-4">You must be signed in to join the discussion.</p>
                  <Link to="/login" className="text-neon-blue font-bold hover:underline">Sign In Now</Link>
                </div>
              )}

              <div className="space-y-6">
                {article.comments?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((comment, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-grow">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-[rgb(var(--foreground))]">{comment.userName}</p>
                          <p className="text-xs text-slate-400">{safeFormat(comment.createdAt, 'MMM dd, h:mm a')}</p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(!article.comments || article.comments.length === 0) && (
                  <p className="text-center text-slate-500 py-8">No comments yet. Be the first to share your thoughts!</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            {/* Author Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold mb-6">About the Author</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-neon-blue/10 rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-neon-blue" />
                </div>
                <div>
                  <p className="font-bold text-[rgb(var(--foreground))]">{article.authorName}</p>
                  <p className="text-sm text-slate-500">Medical Specialist</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Dedicated to providing accurate and accessible health information to help you live your best life.
              </p>
              <button className="w-full py-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-bold hover:bg-neon-blue hover:text-slate-900 transition-all">
                View Profile
              </button>
            </div>

            {/* Newsletter */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-neon-blue/40 transition-colors"></div>
              <h3 className="text-xl font-bold mb-4 relative z-10">Stay Updated</h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10">
                Get the latest health tips and news delivered straight to your inbox.
              </p>
              <div className="space-y-3 relative z-10">
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:ring-2 focus:ring-neon-blue outline-none transition-all text-sm"
                />
                <button className="w-full py-3 bg-neon-blue text-slate-900 rounded-xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
