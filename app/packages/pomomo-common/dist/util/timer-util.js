export function calcTimeRemaining(secondsRemaining, resolutionM) {
    const h = Math.floor(secondsRemaining / 3600);
    let m = Math.floor((secondsRemaining % 3600) / 60);
    if (resolutionM && m > 0) {
        m = Math.floor(resolutionM * Math.ceil(m / resolutionM));
    }
    // console.debug(
    // 	'timer-util.getTimeRemaining() ~',
    // 	`t: ${secondsRemaining} h: ${h} m: ${m}`,
    // );
    return { hours: h, minutes: m };
}
//# sourceMappingURL=timer-util.js.map