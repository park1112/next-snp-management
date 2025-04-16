// src/components/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';
import styles from '../styles/Button.module.css';

const Button: React.FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => {
    return (
        <button className={styles.button} {...props}>
            {children}
        </button>
    );
};

export default Button;
