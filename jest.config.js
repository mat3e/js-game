/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        resources: 'usable',
    },
    reporters: [['github-actions', {silent: false}], 'summary'],
};
