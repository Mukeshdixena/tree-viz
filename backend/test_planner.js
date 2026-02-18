async function test() {
    try {
        const loginRes = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'demo_user', password: 'password123' })
        });
        const { access_token } = await loginRes.json();
        const headers = { Authorization: `Bearer ${access_token}` };

        const res = await fetch('http://localhost:3001/planner?date=2026-02-16', { headers });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data).substring(0, 100));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
