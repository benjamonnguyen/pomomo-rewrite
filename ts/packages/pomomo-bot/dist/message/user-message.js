const greetings = [
    'Howdy howdy! Let\'s do this thang. :cowboy:',
    'Hey there! Let\'s get started!',
    'It\'s productivity o\'clock! :clock1:',
    'Let\'s ketchup on some work!',
];
const encouragements = [
    'Let\'s keep it going!',
    'Keep up the good work!',
    'That\'s what I\'m talking about!',
    'You got this!',
    'You\'re doing amazing!',
];
const idleChecks = [
    'Phew...I was getting nervous 😅',
    'Gotcha! Just checking 😊',
    'Cool beans! :beans:',
];
const farewells = [
    'See you again soon! 👋',
    'Goodbye! 👋'
];
const getRandom = (messages) => {
    return messages.at(Math.floor(Math.random() * messages.length));
};
export const getGreeting = () => {
    return getRandom(greetings);
};
export const getEncouragements = () => {
    return getRandom(encouragements);
};
export const getIdleCheck = () => {
    return getRandom(idleChecks);
};
export const getFarewell = () => {
    return getRandom(farewells);
};
//# sourceMappingURL=user-message.js.map