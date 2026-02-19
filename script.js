const nicknameInput = document.getElementById('nickname');
const versionSelect = document.getElementById('version');
const clientPathInput = document.getElementById('clientPath');
const javaPathInput = document.getElementById('javaPath');
const ramSelect = document.getElementById('ram');
const fullscreenInput = document.getElementById('fullscreen');
const dirPicker = document.getElementById('dirPicker');
const browseBtn = document.getElementById('browseBtn');
const launchBtn = document.getElementById('launchBtn');
const status = document.getElementById('status');

browseBtn.addEventListener('click', () => {
  dirPicker.click();
});

dirPicker.addEventListener('change', (event) => {
  const firstFile = event.target.files?.[0];
  if (!firstFile) {
    return;
  }

  const relativePath = firstFile.webkitRelativePath || '';
  const folderName = relativePath.split('/')[0] || 'Выбранная папка';
  clientPathInput.value = folderName;
});

launchBtn.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    status.textContent = 'Ошибка: укажите никнейм перед запуском.';
    return;
  }

  if (nickname.length < 3) {
    status.textContent = 'Ошибка: никнейм должен быть не короче 3 символов.';
    return;
  }

  const config = {
    nickname,
    version: versionSelect.value,
    clientPath: clientPathInput.value.trim() || 'не указан',
    javaPath: javaPathInput.value.trim() || 'системный java',
    ramMb: Number(ramSelect.value),
    fullscreen: fullscreenInput.checked,
  };

  status.textContent = `Подготовка запуска...\n\n` +
    `Ник: ${config.nickname}\n` +
    `Версия: ${config.version}\n` +
    `Путь клиента: ${config.clientPath}\n` +
    `Java: ${config.javaPath}\n` +
    `RAM: ${config.ramMb} MB\n` +
    `Полноэкранный режим: ${config.fullscreen ? 'да' : 'нет'}\n\n` +
    `Команда (пример): java -Xmx${config.ramMb}M -jar minecraft-${config.version}.jar`;
});
