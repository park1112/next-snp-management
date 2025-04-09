// src/components/InputField.tsx
import React, { ChangeEvent } from 'react';
import styles from '../styles/Form.module.css';

interface InputFieldProps {
    label?: string;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, type = 'text', value, onChange, error, placeholder }) => {
    return (
        <div className={styles.inputGroup}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                className={styles.input}
                placeholder={placeholder}
            />
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
};

export default InputField;
