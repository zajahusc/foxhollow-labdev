export function resultCopy(state) {
    switch (state) {
        case 'solved': return { heading: 'Success! Puzzle complete.', message: 'You solved today’s puzzle correctly.' };
        case 'assisted': return { heading: 'Complete with assistance', message: 'You completed the puzzle after revealing the answer. No points awarded.' };
        case 'revealed': return { heading: 'Answer revealed', message: 'You revealed the solution. This is not a scored solve.' };
        case 'failed': return { heading: 'Not solved', message: 'You used all your attempts. The correct answer is below.' };
    }
}
export function answerCard(answer, label = 'Correct answer') {
    const card = document.createElement('div');
    card.className = 'correct-answer';
    const caption = document.createElement('p');
    caption.className = 'eyebrow';
    caption.textContent = label;
    const value = document.createElement('p');
    value.className = 'correct-answer-value';
    value.textContent = answer;
    card.append(caption, value);
    return card;
}
