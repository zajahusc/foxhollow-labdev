import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
 {ignores:['games/build/**']},
 js.configs.recommended,
 ...ts.configs.recommended,
 {files:['games/src/**/*.ts'],rules:{'no-undef':'off','@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]}},
 {files:['games/tests/**/*.mjs','eslint.config.mjs'],languageOptions:{globals:{console:'readonly',process:'readonly',window:'readonly',document:'readonly',navigator:'readonly',localStorage:'readonly',Storage:'readonly',structuredClone:'readonly'}},rules:{'@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]}}
);
