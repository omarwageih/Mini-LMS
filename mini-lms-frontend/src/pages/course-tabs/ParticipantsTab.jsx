import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Mail, BookOpen } from 'lucide-react';
import { studentAPI } from '../../services/api';
import { SkeletonTable } from '../../components/Skeletons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ParticipantsTab = ({ courseId }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await studentAPI.getCourseParticipants(courseId);
                setParticipants(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    if (loading) return <SkeletonTable rows={5} cols={4} />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Classmates</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{participants.length} members in this course</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((person) => (
                    <motion.div
                        key={person.UserID}
                        whileHover={{ y: -4 }}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 ring-1 ring-slate-100 dark:ring-white/5">
                                {person.ProfilePicture ? (
                                    <img src={`${API_URL}${person.ProfilePicture}`} alt={person.FullName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-950">
                                        {person.FullName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            {person.IsInstructor && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm">
                                    <ShieldCheck size={10} className="text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                                {person.FullName}
                                {person.IsInstructor && (
                                    <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">Instructor</span>
                                )}
                            </h3>
                            <div className="flex flex-col mt-0.5">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                    <BookOpen size={10} />
                                    {person.Major || 'Student'}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <Mail size={10} />
                                    {person.Email}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ParticipantsTab;
