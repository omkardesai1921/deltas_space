/**
 * Loading Spinner Component
 */

import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 40, fullScreen = false, text = '' }) => {
    if (fullScreen) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <Loader2 size={size} className="animate-spin loading-icon" />
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="loading-inline">
            <Loader2 size={size} className="animate-spin loading-icon" />
            {text && <span className="loading-text">{text}</span>}
        </div>
    );
};

export default LoadingSpinner;
