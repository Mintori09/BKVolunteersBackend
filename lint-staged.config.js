export default {
    'src/**/*.{ts,js}': [
        'pnpm exec prettier --write',
        'pnpm exec eslint --fix', // Added pnpm exec
        'pnpm test --findRelatedTests --passWithNoTests',
    ],
    'src/**/*.ts': [() => 'pnpm build'],
    '**/*.{json,md}': [
        'pnpm exec prettier --write', // Added pnpm exec
    ],
}
