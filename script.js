// Ativando a reatividade da barra deslizante (Slider)
const slider = document.getElementById('orcamento_range');
const visualValue = document.getElementById('orcamento_visual');
const localTipoSelect = document.getElementById('local_tipo');
const periodoSelect = document.getElementById('periodo');
const customTimeFields = document.getElementById('customTimeFields');
const horaInicioInput = document.getElementById('hora_inicio');
const horaTerminoInput = document.getElementById('hora_termino');
const addressFields = document.getElementById('addressFields');
const cepInput = document.getElementById('cep');
const cepStatus = document.getElementById('cepStatus');
const addressInputIds = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
const addressInputs = addressInputIds.map((id) => document.getElementById(id));
const addressLocations = ['Salão do Condomínio', 'Casa Própria / Quintal', 'Chácara / Sítio'];
let cepRequestId = 0;
const menuToggle = document.querySelector('.menu-toggle');
const navbarMenu = document.getElementById('navbarMenu');

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

// Manipulando o envio do formulário consolidado
document.getElementById('partyForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const numeroWhatsAppSuporte = "5511989580867"; // Altere para seu número real com DDD

    // Capturando os inputs textuais e numéricos
    const nome = document.getElementById('nome').value.trim();
    const evento = document.getElementById('evento').value.trim();
    const dataInput = document.getElementById('data').value;
    const periodo = periodoSelect.value === 'Outro horário'
        ? `Outro horário (${horaInicioInput.value} às ${horaTerminoInput.value})`
        : periodoSelect.value;
    const idade = document.getElementById('idade').value;
    const tema = document.getElementById('tema').value.trim();
    const adultos = document.getElementById('adultos').value;
    const criancas = document.getElementById('criancas').value;
    const localTipo = document.getElementById('local_tipo').value;
    const orcamentoDefinido = slider ? slider.value : "3500";
    const endereco = addressLocations.includes(localTipo)
        ? [
            document.getElementById('logradouro').value.trim(),
            document.getElementById('numero').value.trim(),
            document.getElementById('complemento').value.trim(),
            document.getElementById('bairro').value.trim(),
            document.getElementById('cidade').value.trim(),
            document.getElementById('estado').value.trim(),
            document.getElementById('cep').value.trim()
        ].filter(Boolean).join(', ')
        : '';

    // Coletando múltiplos checkboxes de serviços de forma linear
    const checkboxes = document.querySelectorAll('input[name="servicos"]:checked');
    let servicosSelecionados = [];
    checkboxes.forEach((cb) => {
        servicosSelecionados.push(cb.value);
    });
    
    // Tratativa caso nenhum serviço seja clicado
    const listaServicos = servicosSelecionados.length > 0 ? servicosSelecionados.join(', ') : "Apenas Curadoria Geral";

    // Formatando data para o modelo brasileiro (DD/MM/AAAA)
    let dataFormatada = dataInput;
    if (dataInput) {
        const partesData = dataInput.split('-');
        dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
    }

    // Criando a mensagem final limpa e profissional
    const mensagemTexto = `Olá hAPPy! Completei o planejamento da festa no site. Aqui estão todas as minhas variáveis:\n\n` +
                          `👤 *Responsável:* ${nome}\n` +
                          `🎉 *Evento:* ${evento}\n` +
                          `📅 *Data e Período:* ${dataFormatada} (${periodo})\n` +
                          `🎂 *Aniversariante:* ${idade} anos | *Tema:* ${tema}\n` +
                          `👥 *Convidados:* ${adultos} Adultos e ${criancas} Crianças\n` +
                          `🏠 *Local da Festa:* ${localTipo}\n` +
                          (endereco ? `📍 *Endereço:* ${endereco}\n` : '') +
                          `🛠️ *Serviços Solicitados:* ${listaServicos}\n` +
                          `💰 *Orçamento Limite:* R$ ${parseInt(orcamentoDefinido).toLocaleString('pt-BR')}`;

    const urlFinalWhatsApp = `https://wa.me/${numeroWhatsAppSuporte}?text=${encodeURIComponent(mensagemTexto)}`;
    window.location.assign(urlFinalWhatsApp);
});