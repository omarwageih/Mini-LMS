import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Plus, Send, ChevronLeft, Pin, Clock,
    MessageCircle, User, ArrowLeft
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeletons';
import SearchFilter from '../components/SearchFilter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Discussions = () => {
    const { courseId } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showNewPost, setShowNewPost] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyContent, setReplyContent] = useState('');
    const [replying, setReplying] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { if (courseId) fetchPosts(); }, [courseId]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/student/discussions/${courseId}`, { headers });
            const data = await res.json();
            setPosts(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleNewPost = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;
        setPosting(true);
        try {
            await fetch(`${API_URL}/api/student/discussions`, {
                method: 'POST', headers,
                body: JSON.stringify({ courseId: parseInt(courseId), title: newTitle, content: newContent })
            });
            setNewTitle(''); setNewContent(''); setShowNewPost(false);
            fetchPosts();
        } catch (err) { console.error(err); }
        finally { setPosting(false); }
    };

    const openPost = async (post) => {
        setSelectedPost(post);
        setLoadingReplies(true);
        try {
            const res = await fetch(`${API_URL}/api/student/discussions/replies/${post.PostID}`, { headers });
            const data = await res.json();
            setReplies(data);
        } catch (err) { console.error(err); }
        finally { setLoadingReplies(false); }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setReplying(true);
        try {
            await fetch(`${API_URL}/api/student/discussions/reply`, {
                method: 'POST', headers,
                body: JSON.stringify({ postId: selectedPost.PostID, content: replyContent })
            });
            setReplyContent('');
            openPost(selectedPost);
        } catch (err) { console.error(err); }
        finally { setReplying(false); }
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const filteredPosts = posts.filter(p =>
        p.Title?.toLowerCase().includes(search.toLowerCase()) ||
        p.Content?.toLowerCase().includes(search.toLowerCase())
    );

    const roleBadge = (type) => {
        const colors = {
            'Instructor': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'Assistant': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            'Student': 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
        };
        return colors[type] || colors.Student;
    };

    // Thread View
    if (selectedPost) {
        return (
            <div className="space-y-6">
                <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors">
                    <ArrowLeft size={16} /> Back to discussions
                </button>

                {/* Original Post */}
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 p-8 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 overflow-hidden">
                            {selectedPost.ProfilePicture
                                ? <img src={`${API_URL}${selectedPost.ProfilePicture}`} className="w-full h-full object-cover" />
                                : selectedPost.AuthorName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedPost.AuthorName}</h2>
                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg border ${roleBadge(selectedPost.UserType)}`}>
                                    {selectedPost.UserType}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">{timeAgo(selectedPost.CreatedAt)}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-3 uppercase tracking-tighter italic">{selectedPost.Title}</h3>
                            <div className="mt-5 bg-transparent border-none">
                                <MDEditor.Markdown 
                                    source={selectedPost.Content} 
                                    remarkPlugins={[[remarkMath]]}
                                    rehypePlugins={[[rehypeKatex]]}
                                    style={{ backgroundColor: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Replies */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageCircle size={14} /> {replies.length} Replies
                    </h4>

                    {loadingReplies ? (
                        <SkeletonCard />
                    ) : replies.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 p-8 text-center">
                            <p className="text-xs text-slate-400 font-bold">No replies yet. Be the first!</p>
                        </div>
                    ) : (
                        replies.map((reply, i) => (
                            <motion.div
                                key={reply.ReplyID}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 p-5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xs shrink-0 overflow-hidden">
                                        {reply.ProfilePicture
                                            ? <img src={`${API_URL}${reply.ProfilePicture}`} className="w-full h-full object-cover" />
                                            : reply.AuthorName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-800 dark:text-white">{reply.AuthorName}</span>
                                            <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${roleBadge(reply.UserType)}`}>
                                                {reply.UserType}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{timeAgo(reply.CreatedAt)}</span>
                                        </div>
                                        <div className="mt-3 bg-transparent border-none text-sm">
                                            <MDEditor.Markdown 
                                                source={reply.Content} 
                                                remarkPlugins={[[remarkMath]]}
                                                rehypePlugins={[[rehypeKatex]]}
                                                style={{ backgroundColor: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Reply Input */}
                <form onSubmit={handleReply} className="flex gap-3">
                    <input
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-5 py-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        type="submit"
                        disabled={replying || !replyContent.trim()}
                        className="px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send size={14} /> {replying ? 'Sending...' : 'Reply'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        Discussion <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Forum</span>
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Course #{courseId} • Community Thread</p>
                </div>
                <button
                    onClick={() => setShowNewPost(true)}
                    className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={16} /> New Post
                </button>
            </div>

            {/* Search */}
            {posts.length > 0 && (
                <SearchFilter
                    searchValue={search}
                    onSearchChange={setSearch}
                    placeholder="Search discussions..."
                />
            )}

            {/* New Post Form */}
            <AnimatePresence>
                {showNewPost && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleNewPost}
                        className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 p-6 space-y-4 shadow-xl overflow-hidden"
                    >
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Post title..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div data-color-mode="light" className="dark:hidden">
                            <MDEditor
                                value={newContent}
                                onChange={setNewContent}
                                previewOptions={{ remarkPlugins: [[remarkMath]], rehypePlugins: [[rehypeKatex]] }}
                                height={250}
                                className="w-full rounded-xl border border-slate-200"
                            />
                        </div>
                        <div data-color-mode="dark" className="hidden dark:block">
                            <MDEditor
                                value={newContent}
                                onChange={setNewContent}
                                previewOptions={{ remarkPlugins: [[remarkMath]], rehypePlugins: [[rehypeKatex]] }}
                                height={250}
                                className="w-full rounded-xl border border-white/10 bg-slate-800"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowNewPost(false)} className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-400 uppercase hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={posting}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {posting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Posts List */}
            {loading ? (
                <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : filteredPosts.length === 0 ? (
                <EmptyState
                    type="default"
                    title="No Discussions Yet"
                    subtitle="Start a conversation with your classmates and instructor."
                    action={
                        <button onClick={() => setShowNewPost(true)} className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest">
                            Start Discussion
                        </button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {filteredPosts.map((post, i) => (
                        <motion.div
                            key={post.PostID}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => openPost(post)}
                            className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 p-6 hover:border-blue-500/30 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                                    {post.ProfilePicture
                                        ? <img src={`${API_URL}${post.ProfilePicture}`} className="w-full h-full object-cover" />
                                        : post.AuthorName?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        {post.IsPinned && <Pin size={12} className="text-amber-500" />}
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors truncate">{post.Title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2">{post.Content}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <User size={10} /> {post.AuthorName}
                                        </span>
                                        <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${roleBadge(post.UserType)}`}>
                                            {post.UserType}
                                        </span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> {timeAgo(post.CreatedAt)}
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                                            <MessageCircle size={10} /> {post.ReplyCount} replies
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Discussions;
