async function testChat() {
  try {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Tạo lịch trình đi Sapa 2 ngày 1 đêm" })
    });
    const data = await res.json();
    console.log(data.reply);
  } catch (err) {
    console.error(err.message);
  }
}

testChat();
