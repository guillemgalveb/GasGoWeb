const form = document.querySelector('form[data-mode]');
const title = document.querySelector('#auth-title');
const defaultTitle = title.textContent;
const hint = document.querySelector('#auth-note');
const password = form.elements.password;
const submit = form.querySelector('[type="submit"]');
const reveal = form.querySelector('.auth-reveal');
const status = form.querySelector('.auth-status');
const alternate = document.querySelector('.auth-switch');
const sessionView = document.querySelector('.auth-session');
const sessionKey = 'gasgo-demo-session';
const encoder = new TextEncoder();
const register = form.dataset.mode === 'register';

let database;

function accounts() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('gasgo-demo', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('accounts', { keyPath: 'email' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

async function accountOperation(mode, operation) {
  const db = await accounts();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('accounts', mode);
    const request = operation(transaction.objectStore('accounts'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(request.error || transaction.error);
  });
}

async function passwordHash(value, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(value), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600_000 },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function showSession(name) {
  form.hidden = Boolean(name);
  hint.hidden = Boolean(name);
  alternate.hidden = Boolean(name);
  sessionView.hidden = !name;
  title.textContent = name ? 'Tu sesión' : defaultTitle;
  sessionView.querySelector('.auth-greeting').textContent = name ? `Hola, ${name}. Has iniciado sesión en tu cuenta de prueba.` : '';
}

async function getAccount(email) {
  return accountOperation('readonly', store => store.get(email));
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;

  const email = form.elements.email.value.trim().toLowerCase();
  const value = password.value;
  const name = register ? form.elements.name.value.trim() : '';
  if (register && !name) {
    status.textContent = 'Escribe tu nombre para crear la cuenta.';
    form.elements.name.focus();
    return;
  }

  submit.disabled = true;
  status.textContent = register ? 'Creando tu cuenta…' : 'Comprobando tus datos…';
  try {
    let account;
    if (register) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      account = { email, name, salt, hash: await passwordHash(value, salt) };
      await accountOperation('readwrite', store => store.add(account));
    } else {
      account = await getAccount(email);
      const candidate = await passwordHash(value, account?.salt ?? new Uint8Array(16));
      const mismatch = candidate.reduce((difference, byte, index) => difference | (byte ^ (account?.hash[index] ?? 0)), 0);
      if (!account || mismatch) {
        status.textContent = 'El correo o la contraseña no son correctos.';
        return;
      }
    }

    sessionStorage.setItem(sessionKey, account.email);
    form.reset();
    password.type = 'password';
    reveal.textContent = 'Mostrar';
    reveal.setAttribute('aria-pressed', 'false');
    status.textContent = '';
    showSession(account.name);
    sessionView.querySelector('a').focus();
  } catch (error) {
    status.textContent = error?.name === 'ConstraintError'
      ? 'Ya existe una cuenta con ese correo en este navegador.'
      : 'No se pudo guardar o consultar la cuenta de prueba en este navegador.';
  } finally {
    submit.disabled = false;
  }
});

reveal.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  reveal.textContent = visible ? 'Ocultar' : 'Mostrar';
  reveal.setAttribute('aria-pressed', String(visible));
});

sessionView.querySelector('.auth-signout').addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  showSession();
  form.elements.email.focus();
});

async function start() {
  try {
    if (!crypto.subtle) throw new Error('Web Crypto unavailable');
    await accounts();
    const email = sessionStorage.getItem(sessionKey);
    if (email) showSession((await getAccount(email))?.name);
    reveal.hidden = false;
    submit.disabled = false;
  } catch {
    status.textContent = 'La cuenta de prueba requiere HTTPS y almacenamiento habilitado en el navegador.';
  }
}

start();
