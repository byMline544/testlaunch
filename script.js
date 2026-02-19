const nicknameInput = document.getElementById('nickname');
const clientPathInput = document.getElementById('clientPath');
const javaPathInput = document.getElementById('javaPath');
const ramSelect = document.getElementById('ram');
const fullscreenInput = document.getElementById('fullscreen');
const downloadBtn = document.getElementById('downloadBtn');
const launchBtn = document.getElementById('launchBtn');
const status = document.getElementById('status');

function buildPayload() {
  return {
    nickname: nicknameInput.value.trim(),
    gameDir: clientPathInput.value.trim(),
    javaPath: javaPathInput.value.trim(),
    ramMb: Number(ramSelect.value),
    fullscreen: fullscreenInput.checked,
  };
}

function setStatus(message) {
  status.textContent = message;
}

async function callApi(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Неизвестная ошибка');
  }

  return data;
}

downloadBtn.addEventListener('click', async () => {
  const payload = buildPayload();

  if (!payload.gameDir) {
    setStatus('Ошибка: укажите путь к папке клиента.');
    return;
  }

  setStatus('Выгрузка версии 1.5.2...');

  try {
    const result = await callApi('/api/download', payload);
    setStatus(`${result.message}\n\nФайлы:\n- ${result.files.versionJsonPath}\n- ${result.files.versionJarPath}`);
  } catch (error) {
    setStatus(`Ошибка выгрузки: ${error.message}`);
  }
});

launchBtn.addEventListener('click', async () => {
  const payload = buildPayload();

  if (!payload.nickname) {
    setStatus('Ошибка: укажите никнейм.');
    return;
  }

  if (payload.nickname.length < 3) {
    setStatus('Ошибка: никнейм должен быть не короче 3 символов.');
    return;
  }

  if (!payload.gameDir) {
    setStatus('Ошибка: укажите путь к папке клиента.');
    return;
  }

  setStatus('Инициализация запуска Minecraft 1.5.2...');

  try {
    const result = await callApi('/api/launch', payload);
    setStatus(result.message);
  } catch (error) {
    setStatus(`Ошибка запуска: ${error.message}`);
  }
});
