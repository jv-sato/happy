import { ADDRESS_LOCATIONS, DEFAULT_BUDGET, SCREEN_NAMES, STORAGE_KEYS, dom } from './config.js?v=service-search';
import {
  clearKeys,
  formatBrazilianDate,
  formatCurrency,
  getLatestAllowedBirthDate,
  readJson,
  setStatus,
  writeJson
} from './helpers.js';

const state = {
  cepRequestId: 0,
  deferredInstallPrompt: null,
  nextScreenScrollPosition: 'top'
};

function setMenuState(isOpen) {
  const { menuToggle, navbarMenu } = dom;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  menuToggle.classList.toggle('is-open', isOpen);
  navbarMenu.hidden = !isOpen;
}

function getScreenFromHash() {
  const requestedScreen = window.location.hash.slice(1);
  return SCREEN_NAMES.has(requestedScreen) ? requestedScreen : 'inicio';
}

function renderScreen() {
  const activeScreen = getScreenFromHash();
  dom.menuToggle.hidden = activeScreen === 'inicio';
  dom.shareAppButton.hidden = activeScreen !== 'inicio';

  dom.screenSections.forEach((section) => {
    section.hidden = section.dataset.screen !== activeScreen;
  });

  window.scrollTo(0, state.nextScreenScrollPosition === 'bottom' ? document.documentElement.scrollHeight : 0);
  state.nextScreenScrollPosition = 'top';

  dom.screenLinks.forEach((link) => {
    if (link.dataset.navScreen === activeScreen) {
      link.setAttribute('aria-current', 'page');
      return;
    }
    link.removeAttribute('aria-current');
  });
}

function renderSelectedServices() {
  const selectedServices = Array.from(dom.serviceCards).filter((card) => card.classList.contains('is-selected'));
  const hasSelectedServices = selectedServices.length > 0;
  dom.partyDetails.hidden = !hasSelectedServices;
  dom.requestQuoteButton.hidden = !hasSelectedServices;
  dom.partyServicesCount.textContent = String(selectedServices.length);
  dom.partyServicesCount.hidden = !hasSelectedServices;
  dom.partyServicesCount.parentElement.parentElement.setAttribute(
    'aria-label',
    `Minha festa, ${selectedServices.length} ${selectedServices.length === 1 ? 'serviço selecionado' : 'serviços selecionados'}`
  );

  dom.serviceCards.forEach((card) => {
    const selected = card.classList.contains('is-selected');
    const button = card.querySelector('.service-add-button');
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Remover' : 'Adicionar'} ${card.dataset.service} ${selected ? 'da' : 'à'} Minha Festa`);
    button.querySelector('span').textContent = selected ? 'Remover' : 'Adicionar';
    button.querySelector('svg').replaceWith(createServiceActionIcon(selected));
  });

  dom.selectedServicesContainer.replaceChildren();
  if (selectedServices.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-services';
    emptyMessage.textContent = 'Ainda não há serviços selecionados. Explore as categorias para montar sua festa.';
    dom.selectedServicesContainer.append(emptyMessage);
    return;
  }

  const servicesByCategory = new Map();
  selectedServices.forEach((card) => {
    const category = card.dataset.category;
    if (!servicesByCategory.has(category)) servicesByCategory.set(category, []);
    servicesByCategory.get(category).push(card.dataset.service);
  });

  servicesByCategory.forEach((services, category) => {
    const group = document.createElement('section');
    group.className = 'selected-service-group';

    const heading = document.createElement('h2');
    heading.className = 'title-md';
    heading.textContent = category;

    const list = document.createElement('ul');
    services.forEach((service) => {
      const item = document.createElement('li');
      item.textContent = service;
      list.append(item);
    });

    group.append(heading, list);
    dom.selectedServicesContainer.append(group);
  });
}

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function filterServices() {
  const query = normalizeSearchText(dom.servicesSearch.value);
  let visibleCount = 0;

  document.querySelectorAll('.service-category').forEach((category) => {
    let categoryVisibleCount = 0;
    category.querySelectorAll('.service-card[data-service]').forEach((card) => {
      const searchableText = normalizeSearchText([
        card.dataset.service,
        card.dataset.category,
        card.querySelector('.service-card-copy').textContent
      ].join(' '));
      const matches = !query || searchableText.includes(query);
      card.hidden = !matches;
      if (matches) categoryVisibleCount += 1;
    });

    category.hidden = categoryVisibleCount === 0;
    visibleCount += categoryVisibleCount;
  });

  if (!query) {
    dom.servicesSearchStatus.textContent = '';
  } else if (visibleCount === 0) {
    dom.servicesSearchStatus.textContent = `Nenhum serviço encontrado para "${dom.servicesSearch.value.trim()}".`;
  } else {
    dom.servicesSearchStatus.textContent = `${visibleCount} ${visibleCount === 1 ? 'serviço encontrado' : 'serviços encontrados'}.`;
  }
}

function createServiceActionIcon(selected) {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');

  const paths = selected
    ? ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v5', 'M14 11v5']
    : ['M12 5v14', 'M5 12h14'];

  paths.forEach((d) => {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', d);
    icon.append(path);
  });

  return icon;
}

function updateCustomTimeVisibility() {
  const showCustomTime = dom.periodoSelect.value === 'Outro horário';
  dom.customTimeFields.hidden = !showCustomTime;
  dom.horaInicioInput.required = showCustomTime;
  dom.horaTerminoInput.required = showCustomTime;

  if (!showCustomTime) {
    dom.horaInicioInput.value = '';
    dom.horaTerminoInput.value = '';
  }
}

function updateAddressVisibility() {
  const showAddress = ADDRESS_LOCATIONS.includes(dom.localTipoSelect.value);
  dom.addressFields.hidden = !showAddress;

  dom.addressInputs.forEach((input) => {
    input.required = showAddress;
    if (!showAddress) input.value = '';
  });

  if (!showAddress) {
    state.cepRequestId += 1;
    document.getElementById('complemento').value = '';
    setAddressStatus('');
  }
}

function formatCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function setAddressStatus(message, isError = false) {
  setStatus(dom.cepStatus, message, isError);
}

async function lookupCep() {
  const cep = dom.cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) return;

  const requestId = ++state.cepRequestId;
  setAddressStatus('Consultando CEP...');

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error(`Consulta de CEP retornou HTTP ${response.status}`);

    const address = await response.json();
    if (requestId !== state.cepRequestId) return;

    if (address.erro) {
      setAddressStatus('CEP não encontrado. Confira o número e tente novamente.', true);
      return;
    }

    document.getElementById('logradouro').value = address.logradouro || '';
    document.getElementById('bairro').value = address.bairro || '';
    document.getElementById('cidade').value = address.localidade || '';
    document.getElementById('estado').value = address.uf || '';
    savePartyDraft();
    setAddressStatus('Endereço preenchido. Confira os dados e informe o número.');
    document.getElementById('numero').focus();
  } catch (error) {
    if (requestId !== state.cepRequestId) return;
    console.error('Não foi possível consultar o CEP:', error);
    setAddressStatus('Não foi possível consultar o CEP. Verifique sua conexão ou preencha o endereço manualmente.', true);
  }
}

function validateBirthDate() {
  dom.nascimentoInput.setCustomValidity(
    dom.nascimentoInput.value && dom.nascimentoInput.value > getLatestAllowedBirthDate()
      ? 'É necessário ter pelo menos 18 anos.'
      : ''
  );
}

function getPartyDraft() {
  return {
    fields: Object.fromEntries(
      Array.from(dom.partyForm.querySelectorAll('input, select, textarea'))
        .map((input) => [input.id, input.value])
    ),
    selectedServices: Array.from(dom.serviceCards)
      .filter((card) => card.classList.contains('is-selected'))
      .map((card) => card.dataset.service),
    budget: dom.slider.value
  };
}

function savePartyDraft() {
  try {
    writeJson(STORAGE_KEYS.partyDraft, getPartyDraft());
    setStatus(dom.partyStorageStatus, '');
  } catch (error) {
    console.error('Não foi possível salvar os dados da festa:', error);
    setStatus(dom.partyStorageStatus, 'Não foi possível salvar os dados da festa. Verifique o armazenamento do navegador.', true);
  }
}

function restorePartyDraft() {
  try {
    const draft = readJson(STORAGE_KEYS.partyDraft);
    if (!draft || typeof draft !== 'object' || !draft.fields || typeof draft.fields !== 'object') return;
    applyPartyData(draft);
  } catch (error) {
    console.error('Não foi possível carregar os dados salvos da festa:', error);
    setStatus(dom.partyStorageStatus, 'Não foi possível carregar os dados salvos da festa.', true);
  }
}

function applyPartyData(partyData) {
  Array.from(dom.partyForm.querySelectorAll('input, select, textarea')).forEach((input) => {
    if (typeof partyData.fields[input.id] === 'string') input.value = partyData.fields[input.id];
  });

  if (typeof partyData.budget === 'string' && Number(partyData.budget) >= Number(dom.slider.min)
    && Number(partyData.budget) <= Number(dom.slider.max)) {
    dom.slider.value = partyData.budget;
    dom.visualValue.textContent = `R$ ${parseInt(dom.slider.value).toLocaleString('pt-BR')}`;
  }

  if (Array.isArray(partyData.selectedServices)) {
    dom.serviceCards.forEach((card) => {
      card.classList.toggle('is-selected', partyData.selectedServices.includes(card.dataset.service));
    });
  }

  updateAddressVisibility();
  updateCustomTimeVisibility();
  renderSelectedServices();
}

function renderSavedPartyRequest(request) {
  const fieldLabels = {
    evento: 'Nome do evento',
    data: 'Data da festa',
    periodo: 'Período',
    hora_inicio: 'Horário de início',
    hora_termino: 'Horário de término',
    idade: 'Idade do(a) aniversariante',
    tema: 'Tema',
    adultos: 'Número de adultos',
    criancas: 'Número de crianças',
    local_tipo: 'Local',
    cep: 'CEP',
    logradouro: 'Rua / Avenida',
    numero: 'Número',
    complemento: 'Complemento',
    bairro: 'Bairro',
    cidade: 'Cidade',
    estado: 'Estado'
  };

  const entries = Object.entries(fieldLabels)
    .filter(([id]) => request.fields[id])
    .map(([id, label]) => [label, id === 'data' ? formatBrazilianDate(request.fields[id]) : request.fields[id]]);

  if (Array.isArray(request.services) && request.services.length) {
    entries.push(['Serviços selecionados', request.services
      .map(({ category, service }) => `${category}: ${service}`)
      .join('\n')]);
  }

  if (request.budget) {
    entries.push(['Orçamento limite estimado', formatCurrency(Number(request.budget))]);
  }

  dom.savedPartyRequestDetails.replaceChildren();
  entries.forEach(([label, value]) => {
    const term = document.createElement('dt');
    term.textContent = label;

    const description = document.createElement('dd');
    description.textContent = value;

    dom.savedPartyRequestDetails.append(term, description);
  });

  dom.savedPartyRequest.hidden = entries.length === 0;
  dom.editSavedPartyRequestButton.hidden = entries.length === 0;
}

function restoreSavedPartyRequest() {
  try {
    const savedRequest = readJson(STORAGE_KEYS.partyRequest);
    if (savedRequest) renderSavedPartyRequest(savedRequest);
  } catch (error) {
    console.error('Não foi possível carregar a cópia do orçamento:', error);
    setStatus(dom.accountStatus, 'Não foi possível carregar a cópia do orçamento salvo.', true);
  }
}

function setAccountSavedState(isSaved) {
  dom.accountTitle.textContent = isSaved ? 'Minha Conta' : 'Conta';
  dom.saveAccountButton.hidden = isSaved;
  dom.deleteAccountLink.hidden = !isSaved;
  dom.accountInputs.forEach((input) => {
    input.readOnly = isSaved;
  });
}

function getSavedAccount() {
  try {
    const savedAccount = readJson(STORAGE_KEYS.account);
    if (!savedAccount || typeof savedAccount !== 'object') return null;
    return savedAccount;
  } catch (error) {
    console.error('Não foi possível ler os dados da conta para solicitar o orçamento:', error);
    setStatus(dom.accountStatus, 'Não foi possível acessar os dados da conta. Tente novamente.', true);
    return null;
  }
}

function hasRequiredAccountData(accountData) {
  return accountData && ['nome', 'celular', 'email', 'nascimento'].every((field) => (
    typeof accountData[field] === 'string' && accountData[field].trim()
  ));
}

function requireSavedAccount(event) {
  const accountData = getSavedAccount();
  if (hasRequiredAccountData(accountData)) return accountData;

  event.preventDefault();
  dom.accountTitle.textContent = 'Criar Conta';
  setStatus(dom.accountStatus, '');
  window.location.hash = 'conta';
  return null;
}

function getSelectedServicesByCategory() {
  const selectedServices = Array.from(dom.serviceCards)
    .filter((card) => card.classList.contains('is-selected'));

  if (selectedServices.length === 0) return 'Nenhum serviço específico (curadoria geral)';

  const categories = new Map();
  selectedServices.forEach((card) => {
    const category = card.dataset.category;
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(card.dataset.service);
  });

  return Array.from(categories, ([category, services]) => `${category}: ${services.join(', ')}`).join('\n');
}

function formatQuoteMessage(accountData) {
  const period = dom.periodoSelect.value === 'Outro horário'
    ? `Outro horário (${dom.horaInicioInput.value} às ${dom.horaTerminoInput.value})`
    : dom.periodoSelect.value;

  const venueAddress = ADDRESS_LOCATIONS.includes(dom.localTipoSelect.value)
    ? [
        document.getElementById('logradouro').value.trim(),
        document.getElementById('numero').value.trim(),
        document.getElementById('complemento').value.trim(),
        document.getElementById('bairro').value.trim(),
        document.getElementById('cidade').value.trim(),
        document.getElementById('estado').value.trim(),
        dom.cepInput.value.trim()
      ].filter(Boolean).join(', ')
    : '';

  const budget = formatCurrency(Number(dom.slider.value));

  return [
    'Olá, Happy! Gostaria de solicitar um orçamento para minha festa.',
    '',
    '*DADOS PESSOAIS*',
    `Nome: ${accountData.nome.trim()}`,
    `Celular: ${accountData.celular.trim()}`,
    `E-mail: ${accountData.email.trim()}`,
    ...(accountData.cpf ? [`CPF: ${accountData.cpf.trim()}`] : []),
    `Data de nascimento: ${formatBrazilianDate(accountData.nascimento.trim())}`,
    '',
    '*DADOS DA FESTA*',
    `Nome do evento: ${document.getElementById('evento').value.trim()}`,
    `Data da festa: ${formatBrazilianDate(document.getElementById('data').value.trim())}`,
    `Período: ${period}`,
    `Idade do(a) aniversariante: ${document.getElementById('idade').value.trim()}`,
    `Tema: ${document.getElementById('tema').value.trim()}`,
    `Adultos: ${document.getElementById('adultos').value.trim()}`,
    `Crianças: ${document.getElementById('criancas').value.trim()}`,
    `Local: ${dom.localTipoSelect.value}`,
    ...(venueAddress ? [`Endereço: ${venueAddress}`] : []),
    `Orçamento limite: ${budget}`,
    '',
    '*SERVIÇOS SELECIONADOS*',
    getSelectedServicesByCategory()
  ].join('\n');
}

function initNavigation() {
  dom.menuToggle.addEventListener('click', () => {
    const isOpen = dom.menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
  });

  dom.navbarMenu.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    setMenuState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || dom.navbarMenu.hidden) return;
    setMenuState(false);
    dom.menuToggle.focus();
  });

  window.addEventListener('hashchange', renderScreen);
}

function initServices() {
  dom.servicesSearch.addEventListener('input', filterServices);
  dom.serviceCards.forEach((card) => {
    card.querySelector('.service-add-button').addEventListener('click', () => {
      card.classList.toggle('is-selected');
      renderSelectedServices();
      savePartyDraft();
    });
  });
}

function initBudget() {
  if (dom.slider && dom.visualValue) {
    dom.slider.addEventListener('input', () => {
      dom.visualValue.textContent = `R$ ${parseInt(dom.slider.value).toLocaleString('pt-BR')}`;
      savePartyDraft();
    });
  }
}

function initAddressFields() {
  dom.localTipoSelect.addEventListener('change', updateAddressVisibility);
  dom.periodoSelect.addEventListener('change', updateCustomTimeVisibility);
  dom.cepInput.addEventListener('input', () => {
    dom.cepInput.value = formatCep(dom.cepInput.value);
    state.cepRequestId += 1;
    ['logradouro', 'bairro', 'cidade', 'estado'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    setAddressStatus('');

    if (dom.cepInput.value.replace(/\D/g, '').length === 8) {
      lookupCep();
    }
  });

  updateAddressVisibility();
  updateCustomTimeVisibility();
}

function initAccountForm() {
  dom.nascimentoInput.addEventListener('input', validateBirthDate);
  dom.nascimentoInput.addEventListener('change', validateBirthDate);

  try {
    const savedAccount = readJson(STORAGE_KEYS.account);
    if (savedAccount) {
      dom.accountInputs.forEach((input) => {
        if (typeof savedAccount[input.id] === 'string') input.value = savedAccount[input.id];
      });
      setAccountSavedState(true);
    }
  } catch (error) {
    console.error('Não foi possível carregar os dados da conta:', error);
    setStatus(dom.accountStatus, 'Não foi possível carregar os dados salvos da conta.', true);
  }

  dom.accountForm.addEventListener('submit', (event) => {
    event.preventDefault();
    validateBirthDate();
    if (!dom.accountForm.reportValidity()) return;

    const accountData = Object.fromEntries(
      dom.accountInputs.map((input) => [input.id, input.value.trim()])
    );

    try {
      writeJson(STORAGE_KEYS.account, accountData);
      setAccountSavedState(true);
      setStatus(dom.accountStatus, '🔒 Seus dados estão protegidos em conformidade com a LGPD e serão utilizados exclusivamente para a elaboração do orçamento e execução da sua festa.');
      state.nextScreenScrollPosition = dom.partyForm.checkValidity() ? 'bottom' : 'top';
      window.location.hash = 'minha-festa';
    } catch (error) {
      console.error('Não foi possível salvar os dados da conta:', error);
      setStatus(dom.accountStatus, 'Não foi possível salvar os dados. Verifique o armazenamento do navegador e tente novamente.', true);
    }
  });

  dom.deleteAccountLink.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      clearKeys([STORAGE_KEYS.account, STORAGE_KEYS.partyDraft, STORAGE_KEYS.partyRequest]);
      dom.accountForm.reset();
      dom.partyForm.reset();
      dom.serviceCards.forEach((card) => card.classList.remove('is-selected'));
      dom.slider.value = DEFAULT_BUDGET;
      dom.visualValue.textContent = 'R$ 4.900';
      updateAddressVisibility();
      updateCustomTimeVisibility();
      renderSelectedServices();
      renderSavedPartyRequest({ fields: {} });
      setStatus(dom.partyStorageStatus, '');
      setAccountSavedState(false);
      setStatus(dom.accountStatus, 'Conta excluida com sucesso.');
    } catch (error) {
      console.error('Não foi possível excluir os dados da conta:', error);
      setStatus(dom.accountStatus, 'Não foi possível excluir os dados da conta. Tente novamente.', true);
    }
  });
}

function initPartyForm() {
  restorePartyDraft();
  restoreSavedPartyRequest();
  dom.partyForm.addEventListener('input', savePartyDraft);
  dom.partyForm.addEventListener('change', savePartyDraft);

  dom.editSavedPartyRequestButton.addEventListener('click', () => {
    try {
      const savedRequest = readJson(STORAGE_KEYS.partyRequest);
      if (!savedRequest) throw new Error('Não há orçamento salvo para editar.');

      if (!savedRequest || typeof savedRequest !== 'object' || !savedRequest.fields || typeof savedRequest.fields !== 'object') {
        throw new Error('Os dados salvos do orçamento estão em um formato inválido.');
      }

      applyPartyData({
        fields: savedRequest.fields,
        budget: savedRequest.budget,
        selectedServices: Array.isArray(savedRequest.services)
          ? savedRequest.services.map(({ service }) => service)
          : []
      });

      savePartyDraft();
      window.location.hash = 'minha-festa';
    } catch (error) {
      console.error('Não foi possível carregar o orçamento para edição:', error);
      setStatus(dom.accountStatus, 'Não foi possível carregar os dados do orçamento para edição. Tente novamente.', true);
    }
  });

  dom.requestQuoteButton.addEventListener('click', (event) => {
    requireSavedAccount(event);
  });

  dom.partyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const accountData = requireSavedAccount(event);
    if (!accountData || !dom.partyForm.reportValidity()) return;

    const partyFields = Object.fromEntries(
      Array.from(dom.partyForm.querySelectorAll('input, select, textarea'))
        .map((input) => [input.id, input.value.trim()])
    );

    const partyRequest = {
      fields: partyFields,
      services: Array.from(dom.serviceCards)
        .filter((card) => card.classList.contains('is-selected'))
        .map((card) => ({
          category: card.dataset.category,
          service: card.dataset.service
        })),
      budget: dom.slider.value,
      submittedAt: new Date().toISOString()
    };

    writeJson(STORAGE_KEYS.partyRequest, partyRequest);
    renderSavedPartyRequest(partyRequest);

    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(formatQuoteMessage(accountData))}`;
    window.location.assign(whatsappUrl);
  });
}

function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function showInstallDialog() {
  if (isAppInstalled() || sessionStorage.getItem(STORAGE_KEYS.installPromptDismissed)) return;
  dom.installDialog.showModal();
}

function showInstallInstructions() {
  dom.installDialogHelp.hidden = false;

  if (window.location.protocol === 'file:') {
    dom.installDialogHelp.textContent = 'Para instalar o Happy, acesse o site por um endereço HTTPS. A instalação não funciona abrindo o arquivo diretamente.';
  } else if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
    dom.installDialogHelp.textContent = 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
  } else {
    dom.installDialogHelp.textContent = 'Abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.';
  }
}

function initInstallPrompt() {
  dom.installDialogMessage.textContent = 'Instale o aplicativo para acessar sua festa com mais facilidade.';

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    dom.confirmInstallButton.textContent = 'Instalar Happy';
  });

  window.addEventListener('appinstalled', () => {
    state.deferredInstallPrompt = null;
    dom.installDialog.close();
  });

  dom.confirmInstallButton.addEventListener('click', async () => {
    if (!state.deferredInstallPrompt) {
      showInstallInstructions();
      return;
    }

    state.deferredInstallPrompt.prompt();
    const { outcome } = await state.deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') dom.installDialog.close();
    state.deferredInstallPrompt = null;
  });

  dom.dismissInstallButton.addEventListener('click', () => {
    sessionStorage.setItem(STORAGE_KEYS.installPromptDismissed, 'true');
    dom.installDialog.close();
  });

  dom.installDialog.addEventListener('click', (event) => {
    if (event.target !== dom.installDialog) return;
    sessionStorage.setItem(STORAGE_KEYS.installPromptDismissed, 'true');
    dom.installDialog.close();
  });
}

function initShareButton() {
  dom.shareAppButton.addEventListener('click', async () => {
    const shareData = {
      title: 'Happy',
      text: 'Organize sua festa com o Happy!',
      url: window.location.href.split('#')[0]
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        dom.shareAppStatus.textContent = 'Link copiado!';
        window.setTimeout(() => {
          dom.shareAppStatus.textContent = '';
        }, 3000);
        return;
      }

      window.prompt('Copie o link do Happy para compartilhar:', shareData.url);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Não foi possível compartilhar o Happy:', error);
      dom.shareAppStatus.textContent = 'Não foi possível compartilhar o link.';
    }
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch((error) => console.error('Não foi possível registrar o service worker:', error));
  }
}

export function initializeApp() {
  initNavigation();
  initServices();
  initBudget();
  initAddressFields();
  initAccountForm();
  initPartyForm();
  initInstallPrompt();
  initShareButton();
  registerServiceWorker();

  renderScreen();
  renderSelectedServices();
  window.addEventListener('load', () => {
    window.setTimeout(showInstallDialog, 800);
  }, { once: true });
}
