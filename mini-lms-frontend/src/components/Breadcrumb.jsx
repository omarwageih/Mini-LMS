import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels = {
    '/student': 'Dashboard',
    '/courses': 'My Courses',
    '/course': 'Course Details',
    '/assignments': 'Assignments',
    '/grades': 'Grades',
    '/calendar': 'Calendar',
    '/profile': 'My Profile',
    '/instructor': 'Dashboard',
    '/instructor/students': 'Students',
    '/instructor/assistants': 'Assistants',
    '/instructor/courses': 'Courses',
    '/instructor/submissions': 'Submissions',
    '/assistant': 'Dashboard',
    '/assistant/assignments': 'Assignments',
    '/assistant/submissions': 'Submissions',
    '/assistant/courses': 'Courses',
};

const Breadcrumb = () => {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length <= 1) return null;

    const crumbs = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === pathSegments.length - 1;

        crumbs.push({
            label,
            path: currentPath,
            isLast
        });
    });

    return (
        <nav className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            <Link to="/dashboard" className="text-slate-400 hover:text-blue-500 transition-colors shrink-0">
                <Home size={14} />
            </Link>
            {crumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                    <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
                    {crumb.isLast ? (
                        <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest truncate">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            to={crumb.path}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors truncate"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumb;
