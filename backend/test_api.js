async function test() {
    try {
        const loginRes = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'demo_user',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        if (!token) throw new Error('No token: ' + JSON.stringify(loginData));
        console.log('Token received');

        const headers = { Authorization: `Bearer ${token}` };

        const treesRes = await fetch('http://localhost:3001/trees', { headers });
        const trees = await treesRes.json();
        console.log('Trees count:', trees.length);

        const tasksRes = await fetch('http://localhost:3001/task', { headers });
        const tasks = await tasksRes.json();
        console.log('Tasks count:', tasks.length);

        const journalRes = await fetch('http://localhost:3001/journal', { headers });
        const journal = await journalRes.json();
        console.log('Journal count:', journal.length);

        const statsRes = await fetch('http://localhost:3001/stats/dashboard', { headers });
        const stats = await statsRes.json();
        console.log('Stats Dashboard status:', statsRes.status);
        console.log('Topic Mastery count:', stats.topicMastery?.length);

        process.exit(0);
    } catch (err) {
        console.error('API Test failed:', err.message);
        process.exit(1);
    }
}

test();
