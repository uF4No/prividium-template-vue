/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: ['@repo/eslint-config/vue.cjs'],
    parserOptions: {
        projectService: {
            allowDefaultProject: ['public/config.js']
        },
        tsconfigRootDir: __dirname
    },
    settings: {
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: ['tsconfig.app.json', 'tsconfig.node.json']
            }
        }
    }
};
