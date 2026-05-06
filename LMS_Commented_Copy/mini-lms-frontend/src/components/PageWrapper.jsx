import React from 'react';

const PageWrapper = ({ children }) => {
    return (
        <div className="w-full h-full">
            {children}
        </div>
    );
};

export default PageWrapper;
