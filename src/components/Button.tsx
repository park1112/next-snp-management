// src/components/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';
import styles from '../styles/Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { }

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
    return (
        <button className={styles.button} {...props}>
            {children}
        </button>
    );
};

export default Button;
