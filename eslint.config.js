import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        // Globally ignore these directories
        ignores: [
            'dist/**',
            'node_modules/**',
            'bruno/**',
            'pnpm-lock.yaml',
            '__test__/**',
            'coverage/**',
            '*.config.js',
            '*.config.ts',
            '*.config.cjs',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Add custom rules here
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' },
            ],
        },
    }
)
