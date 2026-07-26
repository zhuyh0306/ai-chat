import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'mastra_app',
});

async function main() {
  const username = process.env.INIT_USERNAME || 'admin';
  const email = process.env.INIT_EMAIL || 'admin@example.com';
  const password = process.env.INIT_PASSWORD || 'admin123';

  await dataSource.initialize();

  const existing = await dataSource.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email],
  );
  if (existing && existing.length > 0) {
    console.log(`账号已存在: ${username} / ${email}，跳过初始化`);
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await dataSource.query(
    `INSERT INTO users (id, username, email, password, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, now(), now())`,
    [randomUUID(), username, email, hashedPassword],
  );

  console.log(`初始化账号成功: ${username} / ${email} (密码: ${password})`);
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('初始化失败:', err);
  process.exit(1);
});
