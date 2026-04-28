import React from 'react';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
    className = "flex items-center gap-2", 
    iconClassName = "w-8 h-8 text-teal-600 dark:text-teal-400",
    textClassName = "text-2xl font-black text-teal-600 dark:text-teal-400 tracking-tighter",
    showText = true
}) => {
    return (
        <div className={className}>
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={iconClassName}
            >
                {/* 
                    The Q's body: An arc starting from right-middle (21,12)
                    going counter-clockwise to the bottom-middle (12,21).
                    This leaves the bottom-right quadrant open.
                */}
                <path d="M21 12a9 9 0 1 0-9 9" />
                
                {/* 
                    The Tick (Q's tail): Starts inside the circle, drops down, 
                    and shoots out the bottom right to complete the Q shape 
                    and form a checkmark.
                */}
                <path d="M12 16l4 4 6-8" />
            </svg>
            {showText && <span className={textClassName}>QUIZTER</span>}
        </div>
    );
};

export default Logo;
