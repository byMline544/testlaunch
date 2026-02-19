const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const https = require('https');
const { Client } = require('minecraft-launcher-core');

const app = express();
const launcher = new Client();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} при запросе ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Не удалось распарсить JSON: ${url}`));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, outputFile) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} при загрузке ${url}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', async () => {
        try {
          await fs.mkdir(path.dirname(outputFile), { recursive: true });
          await fs.writeFile(outputFile, Buffer.concat(chunks));
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function preloadVersion152(gameDir) {
  const manifest = await requestJson('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  const version = manifest.versions.find((v) => v.id === '1.5.2');

  if (!version) {
    throw new Error('Версия 1.5.2 не найдена в официальном манифесте.');
  }

  const versionMeta = await requestJson(version.url);
  const versionDir = path.join(gameDir, 'versions', '1.5.2');
  const versionJsonPath = path.join(versionDir, '1.5.2.json');
  const versionJarPath = path.join(versionDir, '1.5.2.jar');

  await fs.mkdir(versionDir, { recursive: true });
  await fs.writeFile(versionJsonPath, JSON.stringify(versionMeta, null, 2));
  await downloadFile(versionMeta.downloads.client.url, versionJarPath);

  return { versionJsonPath, versionJarPath };
}

app.post('/api/download', async (req, res) => {
  try {
    const gameDir = req.body.gameDir?.trim();

    if (!gameDir) {
      res.status(400).json({ error: 'Укажите путь к папке клиента.' });
      return;
    }

    const result = await preloadVersion152(gameDir);
    res.json({
      ok: true,
      message: 'Выгрузка версии 1.5.2 завершена.',
      files: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/launch', async (req, res) => {
  try {
    const { nickname, gameDir, javaPath, ramMb, fullscreen } = req.body;

    if (!nickname || nickname.trim().length < 3) {
      res.status(400).json({ error: 'Никнейм должен содержать минимум 3 символа.' });
      return;
    }

    if (!gameDir || !gameDir.trim()) {
      res.status(400).json({ error: 'Укажите путь к папке клиента.' });
      return;
    }

    const authUuid = '00000000000000000000000000000000';

    launcher.launch({
      authorization: {
        access_token: '0',
        client_token: '0',
        uuid: authUuid,
        name: nickname.trim(),
        user_properties: {},
        meta: {
          type: 'mojang',
          demo: false,
        },
      },
      root: gameDir.trim(),
      version: {
        number: '1.5.2',
        type: 'release',
      },
      memory: {
        max: `${Number(ramMb) || 2048}M`,
        min: '512M',
      },
      javaPath: javaPath?.trim() || undefined,
      window: {
        fullscreen: Boolean(fullscreen),
      },
    });

    res.json({
      ok: true,
      message: 'Запуск Minecraft 1.5.2 инициирован. Если файлов не хватает, лаунчер их докачает.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Launcher server running on http://localhost:${PORT}`);
});
