import React from 'react';
import { PackageOpen, BookOpen, ClipboardList, FileText, Users, MessageSquare } from 'lucide-react';

const illustrations = {
    courses: { icon: BookOpen, title: 'No Courses Yet', subtitle: 'Enroll in courses to get started on your learning journey.' },
    assignments: { icon: ClipboardList, title: 'No Assignments', subtitle: 'You\'re all caught up! Check back later for new assignments.' },
    grades: { icon: FileText, title: 'No Grades Yet', subtitle: 'Grades will appear here once your submissions are reviewed.' },
    submissions: { icon: PackageOpen, title: 'No Submissions', subtitle: 'No submissions found for the selected filters.' },
    students: { icon: Users, title: 'No Students', subtitle: 'Add students to your class to get started.' },
    materials: { icon: FileText, title: 'No Materials', subtitle: 'Upload course materials like slides, PDFs, and links.' },
    announcements: { icon: MessageSquare, title: 'No Announcements', subtitle: 'Post an announcement to keep your students informed.' },
    default: { icon: PackageOpen, title: 'Nothing Here', subtitle: 'No data to display at the moment.' }
};

const EmptyState = ({ type = 'default', title, subtitle, action }) => {
    const config = illustrations[type] || illustrations.default;
    const Icon = config.icon;
    const displayTitle = title || config.title;
    const displaySubtitle = subtitle || config.subtitle;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                <Icon size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-2">
                {displayTitle}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold max-w-xs">
                {displaySubtitle}
            </p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
