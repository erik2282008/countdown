app.post("/accept", async (req, res) => {
  const { telegram_id, language } = req.body;
  
  try {
    const { pool } = await import('./db.js');
    
    // Проверяем, есть ли уже пользователь
    const existing = await pool.query(
      'SELECT death_timestamp FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    let deathTimestamp;
    
    if (existing.rows.length > 0) {
      // ИСПОЛЬЗУЕМ СУЩЕСТВУЮЩЕЕ ВРЕМЯ
      deathTimestamp = existing.rows[0].death_timestamp;
    } else {
      // Генерируем новое время
      deathTimestamp = new Date(Date.now() + generateWeightedTime());
    }

    // Сохраняем/обновляем в БД
    await pool.query(
      `INSERT INTO users (telegram_id, language, death_timestamp)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET language = $2, death_timestamp = $3`,
      [telegram_id, language, deathTimestamp]
    );
    
    res.json({ success: true, death: deathTimestamp });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
