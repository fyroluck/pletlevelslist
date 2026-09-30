import { store } from './main.js';

export async function fetchManifest() {
    try {
        const result = await fetch('./data/_manifest.json');
        if (!result.ok) return null;
        return await result.json();
    } catch {
        return null;
    }
}

export async function fetchList() {
    let listResult;
    try {
        listResult = await fetch('./data/_list.json');
    } catch {
        return null;
    }

    if (!listResult.ok) return null;

    try {
        const list = await listResult.json();

        const loadedLevels = await Promise.all(
            list.map(async (path) => {
                try {
                    const levelResult = await fetch(`./data/${path}.json`);
                    if (!levelResult.ok) return [null, path];
                    const level = await levelResult.json();

                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent
                            ),
                        },
                        null,
                    ];
                } catch {
                    return [null, path];
                }
            })
        );

        return loadedLevels;
    } catch {
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResult = await fetch('./data/_editors.json');
        if (!editorsResult.ok) return null;
        return await editorsResult.json();
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    if (!list) return null;

    const leaderboard = [];
    let scoreMap = {};

    for (let i = 0; i < list.length; i++) {
        const [level, err] = list[i];
        if (err || !level) continue;

        const rank = i + 1;

        // Verification record
        if (level.verifier) {
            const user = level.verifier.toLowerCase();
            if (!scoreMap[user]) {
                scoreMap[user] = {
                    name: level.verifier,
                    total: 0,
                    verified: [],
                    completed: [],
                    progressed: [],
                };
            }
            scoreMap[user].verified.push({
                rank,
                level: level.name,
                score: 100,
            });
        }

        // Other records
        for (const record of level.records) {
            const user = record.user.toLowerCase();
            if (!scoreMap[user]) {
                scoreMap[user] = {
                    name: record.user,
                    total: 0,
                    verified: [],
                    completed: [],
                    progressed: [],
                };
            }

            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank,
                    level: level.name,
                    score: 100,
                });
            } else if (record.percent >= (level.percentToQualify || 0)) {
                scoreMap[user].progressed.push({
                    rank,
                    level: level.name,
                    percent: record.percent,
                });
            }
        }
    }

    for (const user in scoreMap) {
        leaderboard.push(scoreMap[user]);
    }

    return leaderboard;
}
