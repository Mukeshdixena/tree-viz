async function test() {
    try {
        const loginRes = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'demo_user', password: 'password123' })
        });
        const { access_token } = await loginRes.json();
        const headers = { Authorization: `Bearer ${access_token}` };

        const notesRes = await fetch('http://localhost:3001/note', { headers });
        const notes = await notesRes.json();
        console.log('Notes count:', notes.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
