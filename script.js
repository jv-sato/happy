// Ativando a reatividade da barra deslizante (Slider)
const slider = document.getElementById('orcamento_range');
const visualValue = document.getElementById('orcamento_visual');
const localTipoSelect = document.getElementById('local_tipo');
const periodoSelect = document.getElementById('periodo');
const customTimeFields = document.getElementById('customTimeFields');
const horaInicioInput = document.getElementById('hora_inicio');
const horaTerminoInput = document.getElementById('hora_termino');
const accountForm = document.getElementById('accountForm');
const accountInputs = ['nome', 'celular', 'email', 'cpf', 'nascimento']
    .map((id) => document.getElementById(id));
const nascimentoInput = document.getElementById('nascimento');
const saveAccountButton = document.getElementById('saveAccountButton');
const deleteAccountLink = document.getElementById('deleteAccountLink');
const accountStatus = document.getElementById('accountStatus');
const accountStorageKey = 'happy.user.account';
const partyForm = document.getElementById('partyForm');
const requestQuoteButton = document.getElementById('requestQuoteButton');
const addressFields = document.getElementById('addressFields');
const cepInput = document.getElementById('cep');
const cepStatus = document.getElementById('cepStatus');
const addressInputIds = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
const addressInputs = addressInputIds.map((id) => document.getElementById(id));
const addressLocations = ['Salão do Condomínio', 'Casa Própria / Quintal', 'Chácara / Sítio'];
let cepRequestId = 0;
const menuToggle = document.querySelector('.menu-toggle');
const navbarMenu = document.getElementById('navbarMenu');
const serviceCards = document.querySelectorAll('.service-card[data-service]');
const selectedServicesContainer = document.getElementById('selectedServices');
const screenSections = document.querySelectorAll('[data-screen]');
const screenLinks = document.querySelectorAll('[data-nav-screen]');
const installDialog = document.getElementById('installDialog');
const installDialogMessage = document.getElementById('installDialogMessage');
const installDialogHelp = document.getElementById('installDialogHelp');
const confirmInstallButton = document.getElementById('confirmInstall');
const dismissInstallButton = document.getElementById('dismissInstallDialog');
const shareAppButton = document.getElementById('shareAppButton');
const shareAppStatus = document.getElementById('shareAppStatus');
let deferredInstallPrompt = null;

function getScreenFromHash() {
    const requestedScreen = window.location.hash.slice(1);
    return ['explorar', 'minha-festa', 'conta'].includes(requestedScreen)
        ? requestedScreen
        : 'inicio';
}

function renderScreen() {
    const activeScreen = getScreenFromHash();
    menuToggle.hidden = activeScreen === 'inicio';
    shareAppButton.hidden = activeScreen !== 'inicio';
    screenSections.forEach((section) => {
        section.hidden = section.dataset.screen !== activeScreen;
    });
    screenLinks.forEach((link) => {
        if (link.dataset.navScreen === activeScreen) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function renderSelectedServices() {
    const selectedServices = Array.from(serviceCards).filter((card) => card.classList.contains('is-selected'));
    serviceCards.forEach((card) => {
        const selected = card.classList.contains('is-selected');
        const button = card.querySelector('.service-add-button');
        button.setAttribute('aria-pressed', String(selected));
        button.setAttribute('aria-label', `${selected ? 'Remover' : 'Adicionar'} ${card.dataset.service} ${selected ? 'da' : 'à'} Minha Festa`);
        button.querySelector('span').textContent = selected ? 'Adicionado' : 'Adicionar';
    });

    selectedServicesContainer.replaceChildren();
    if (selectedServices.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-services';
        emptyMessage.textContent = 'Ainda não há serviços selecionados. Explore as categorias para montar sua festa.';
        selectedServicesContainer.append(emptyMessage);
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
        selectedServicesContainer.append(group);
    });
}

window.addEventListener('hashchange', renderScreen);
renderScreen();
renderSelectedServices();
serviceCards.forEach((card) => {
    card.querySelector('.service-add-button').addEventListener('click', () => {
        card.classList.toggle('is-selected');
        renderSelectedServices();
    });
});

function updateCustomTimeVisibility() {
    const showCustomTime = periodoSelect.value === 'Outro horário';
    customTimeFields.hidden = !showCustomTime;
    horaInicioInput.required = showCustomTime;
    horaTerminoInput.required = showCustomTime;

    if (!showCustomTime) {
        horaInicioInput.value = '';
        horaTerminoInput.value = '';
    }
}

menuToggle.addEventListener('click', function() {
    const isOpen = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!isOpen));
    this.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    this.classList.toggle('is-open', !isOpen);
    navbarMenu.hidden = isOpen;
});

navbarMenu.addEventListener('click', function(event) {
    if (!event.target.closest('a')) return;
    navbarMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    menuToggle.classList.remove('is-open');
});

document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape' || navbarMenu.hidden) return;
    navbarMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    menuToggle.classList.remove('is-open');
    menuToggle.focus();
});

if(slider && visualValue) {
    slider.addEventListener('input', function() {
        // Atualiza o valor monetário formatado na tela em tempo real
        visualValue.textContent = `R$ ${parseInt(this.value).toLocaleString('pt-BR')}`;
    });
}

function updateAddressVisibility() {
    const showAddress = addressLocations.includes(localTipoSelect.value);
    addressFields.hidden = !showAddress;
    addressInputs.forEach((input) => {
        input.required = showAddress;
        if (!showAddress) input.value = '';
    });

    if (!showAddress) {
        ++cepRequestId;
        document.getElementById('complemento').value = '';
        setAddressStatus('');
    }
}

function formatCep(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function setAddressStatus(message, isError = false) {
    cepStatus.textContent = message;
    cepStatus.classList.toggle('is-error', isError);
}

async function lookupCep() {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    const requestId = ++cepRequestId;
    setAddressStatus('Consultando CEP...');

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error(`Consulta de CEP retornou HTTP ${response.status}`);

        const address = await response.json();
        if (requestId !== cepRequestId) return;
        if (address.erro) {
            setAddressStatus('CEP não encontrado. Confira o número e tente novamente.', true);
            return;
        }

        document.getElementById('logradouro').value = address.logradouro || '';
        document.getElementById('bairro').value = address.bairro || '';
        document.getElementById('cidade').value = address.localidade || '';
        document.getElementById('estado').value = address.uf || '';
        setAddressStatus('Endereço preenchido. Confira os dados e informe o número.');
        document.getElementById('numero').focus();
    } catch (error) {
        if (requestId !== cepRequestId) return;
        console.error('Não foi possível consultar o CEP:', error);
        setAddressStatus('Não foi possível consultar o CEP. Verifique sua conexão ou preencha o endereço manualmente.', true);
    }
}

localTipoSelect.addEventListener('change', updateAddressVisibility);
periodoSelect.addEventListener('change', updateCustomTimeVisibility);
cepInput.addEventListener('input', function() {
    this.value = formatCep(this.value);
    ++cepRequestId;
    ['logradouro', 'bairro', 'cidade', 'estado'].forEach((id) => {
        document.getElementById(id).value = '';
    });
    setAddressStatus('');
    if (this.value.replace(/\D/g, '').length === 8) lookupCep();
});
updateAddressVisibility();
updateCustomTimeVisibility();

function getLatestAllowedBirthDate() {
    const now = new Date();
    const month = now.getMonth();
    const date = new Date(now.getFullYear() - 18, month, now.getDate());
    if (date.getMonth() !== month) date.setDate(0);

    const year = date.getFullYear();
    const monthText = String(date.getMonth() + 1).padStart(2, '0');
    const dayText = String(date.getDate()).padStart(2, '0');
    return `${year}-${monthText}-${dayText}`;
}

function validateBirthDate() {
    nascimentoInput.setCustomValidity(
        nascimentoInput.value && nascimentoInput.value > getLatestAllowedBirthDate()
            ? 'É necessário ter pelo menos 18 anos.'
            : ''
    );
}

function setAccountStatus(message, isError = false) {
    accountStatus.textContent = message;
    accountStatus.classList.toggle('is-error', isError);
}

function setAccountSavedState(isSaved) {
    saveAccountButton.hidden = isSaved;
    deleteAccountLink.hidden = !isSaved;
    accountInputs.forEach((input) => {
        input.readOnly = isSaved;
    });
}

nascimentoInput.addEventListener('input', validateBirthDate);
nascimentoInput.addEventListener('change', validateBirthDate);

try {
    const savedAccount = localStorage.getItem(accountStorageKey);
    if (savedAccount) {
        const accountData = JSON.parse(savedAccount);
        accountInputs.forEach((input) => {
            if (typeof accountData[input.id] === 'string') {
                input.value = accountData[input.id];
            }
        });
        setAccountSavedState(true);
        setAccountStatus('Seus dados pessoais estão salvos neste navegador.');
    }
} catch (error) {
    console.error('Não foi possível carregar os dados da conta:', error);
    setAccountStatus('Não foi possível carregar os dados salvos da conta.', true);
}

accountForm.addEventListener('submit', (event) => {
    event.preventDefault();
    validateBirthDate();
    if (!accountForm.reportValidity()) return;

    const accountData = Object.fromEntries(
        accountInputs.map((input) => [input.id, input.value.trim()])
    );

    try {
        localStorage.setItem(accountStorageKey, JSON.stringify(accountData));
        setAccountSavedState(true);
        setAccountStatus('🔒 Seus dados estão protegidos em conformidade com a LGPD e serão utilizados exclusivamente para a elaboração do orçamento e execução da sua festa.');
    } catch (error) {
        console.error('Não foi possível salvar os dados da conta:', error);
        setAccountStatus('Não foi possível salvar os dados. Verifique o armazenamento do navegador e tente novamente.', true);
    }
});

deleteAccountLink.addEventListener('click', (event) => {
    event.preventDefault();
    try {
        localStorage.removeItem(accountStorageKey);
        accountForm.reset();
        setAccountSavedState(false);
        setAccountStatus('Conta excluida com sucesso.');
    } catch (error) {
        console.error('Não foi possível excluir os dados da conta:', error);
        setAccountStatus('Não foi possível excluir os dados da conta. Tente novamente.', true);
    }
});

function getSavedAccount() {
    try {
        const savedAccount = localStorage.getItem(accountStorageKey);
        if (!savedAccount) return null;

        const accountData = JSON.parse(savedAccount);
        if (!accountData || typeof accountData !== 'object') return null;
        return accountData;
    } catch (error) {
        console.error('Não foi possível ler os dados da conta para solicitar o orçamento:', error);
        setAccountStatus('Não foi possível acessar os dados da conta. Tente novamente.', true);
        return null;
    }
}

function hasRequiredAccountData(accountData) {
    return accountData
        && ['nome', 'celular', 'email', 'nascimento'].every((field) => (
            typeof accountData[field] === 'string' && accountData[field].trim()
        ));
}

function requireSavedAccount(event) {
    const accountData = getSavedAccount();
    if (hasRequiredAccountData(accountData)) return accountData;

    event.preventDefault();
    setAccountStatus('Preencha e salve seus dados pessoais antes de solicitar o orçamento.');
    window.location.hash = 'conta';
    return null;
}

requestQuoteButton.addEventListener('click', (event) => {
    requireSavedAccount(event);
});

function formatBrazilianDate(value) {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

function getSelectedServicesByCategory() {
    const selectedServices = Array.from(serviceCards)
        .filter((card) => card.classList.contains('is-selected'));
    if (selectedServices.length === 0) return 'Nenhum serviço específico (curadoria geral)';

    const categories = new Map();
    selectedServices.forEach((card) => {
        const category = card.dataset.category;
        if (!categories.has(category)) categories.set(category, []);
        categories.get(category).push(card.dataset.service);
    });

    return Array.from(categories, ([category, services]) => (
        `${category}: ${services.join(', ')}`
    )).join('\n');
}

partyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const accountData = requireSavedAccount(event);
    if (!accountData || !partyForm.reportValidity()) return;

    const period = periodoSelect.value === 'Outro horário'
        ? `Outro horário (${horaInicioInput.value} às ${horaTerminoInput.value})`
        : periodoSelect.value;
    const venueAddress = addressLocations.includes(localTipoSelect.value)
        ? [
            document.getElementById('logradouro').value.trim(),
            document.getElementById('numero').value.trim(),
            document.getElementById('complemento').value.trim(),
            document.getElementById('bairro').value.trim(),
            document.getElementById('cidade').value.trim(),
            document.getElementById('estado').value.trim(),
            cepInput.value.trim()
        ].filter(Boolean).join(', ')
        : '';
    const budget = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(Number(slider.value));
    const message = [
        'Olá, Happy! Gostaria de solicitar um orçamento para minha festa.',
        '',
        '*DADOS PESSOAIS*',
        `Nome: ${accountData.nome.trim()}`,
        `Celular: ${accountData.celular.trim()}`,
        `E-mail: ${accountData.email.trim()}`,
        ...(accountData.cpf ? [`CPF: ${accountData.cpf.trim()}`] : []),
        `Data de nascimento: ${formatBrazilianDate(accountData.nascimento)}`,
        '',
        '*DADOS DA FESTA*',
        `Evento: ${document.getElementById('evento').value.trim()}`,
        `Data: ${formatBrazilianDate(document.getElementById('data').value)}`,
        `Período: ${period}`,
        `Idade do(a) aniversariante: ${document.getElementById('idade').value} anos`,
        `Tema: ${document.getElementById('tema').value.trim()}`,
        `Convidados: ${document.getElementById('adultos').value} adultos e ${document.getElementById('criancas').value} crianças`,
        `Local: ${localTipoSelect.value}`,
        ...(venueAddress ? [`Endereço: ${venueAddress}`] : []),
        '',
        '*SERVIÇOS SELECIONADOS*',
        getSelectedServicesByCategory(),
        '',
        `Orçamento limite estimado: ${budget}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/5511989580867?text=${encodeURIComponent(message)}`;
    window.location.assign(whatsappUrl);
});

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function showInstallDialog() {
    if (isAppInstalled() || sessionStorage.getItem('happy.install-prompt-dismissed')) return;
    installDialog.showModal();
}

function showInstallInstructions() {
    installDialogHelp.hidden = false;
    if (window.location.protocol === 'file:') {
        installDialogHelp.textContent = 'Para instalar o Happy, acesse o site por um endereço HTTPS. A instalação não funciona abrindo o arquivo diretamente.';
    } else if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
        installDialogHelp.textContent = 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
    } else {
        installDialogHelp.textContent = 'Abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.';
    }
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    confirmInstallButton.textContent = 'Instalar Happy';
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installDialog.close();
});

confirmInstallButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
        showInstallInstructions();
        return;
    }

    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') installDialog.close();
    deferredInstallPrompt = null;
});

dismissInstallButton.addEventListener('click', () => {
    sessionStorage.setItem('happy.install-prompt-dismissed', 'true');
    installDialog.close();
});

installDialog.addEventListener('click', (event) => {
    if (event.target !== installDialog) return;
    sessionStorage.setItem('happy.install-prompt-dismissed', 'true');
    installDialog.close();
});

shareAppButton.addEventListener('click', async () => {
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
            shareAppStatus.textContent = 'Link copiado!';
            window.setTimeout(() => {
                shareAppStatus.textContent = '';
            }, 3000);
            return;
        }

        window.prompt('Copie o link do Happy para compartilhar:', shareData.url);
    } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Não foi possível compartilhar o Happy:', error);
        shareAppStatus.textContent = 'Não foi possível compartilhar o link.';
    }
});

if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./service-worker.js')
        .catch((error) => console.error('Não foi possível registrar o service worker:', error));
}

window.addEventListener('load', () => {
    window.setTimeout(showInstallDialog, 800);
}, { once: true });