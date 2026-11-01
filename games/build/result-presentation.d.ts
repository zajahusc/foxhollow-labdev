export type ResultState = 'solved' | 'revealed' | 'failed' | 'assisted';
export declare function resultCopy(state: ResultState): {
    heading: string;
    message: string;
};
export declare function answerCard(answer: string, label?: string): HTMLElement;
