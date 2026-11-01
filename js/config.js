export const STORAGE_KEYS = {
  account: 'happy.user.account',
  partyDraft: 'happy.user.partyDraft',
  partyRequest: 'happy.user.partyRequest',
  installPromptDismissed: 'happy.install-prompt-dismissed'
};

export const SCREEN_NAMES = new Set(['explorar', 'minha-festa', 'conta']);

export const ADDRESS_LOCATIONS = [
  'Salão do Condomínio',
  'Casa Própria / Quintal',
  'Chácara / Sítio'
];

export const DEFAULT_BUDGET = '4900';
export const ACCOUNT_INPUT_IDS = ['nome', 'celular', 'email', 'cpf', 'nascimento'];
export const ADDRESS_INPUT_IDS = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];

export const dom = {
  slider: document.getElementById('orcamento_range'),
  visualValue: document.getElementById('orcamento_visual'),
  localTipoSelect: document.getElementById('local_tipo'),
  periodoSelect: document.getElementById('periodo'),
  customTimeFields: document.getElementById('customTimeFields'),
  horaInicioInput: document.getElementById('hora_inicio'),
  horaTerminoInput: document.getElementById('hora_termino'),
  accountForm: document.getElementById('accountForm'),
  accountInputs: ['nome', 'celular', 'email', 'cpf', 'nascimento']
    .map((id) => document.getElementById(id)),
  nascimentoInput: document.getElementById('nascimento'),
  saveAccountButton: document.getElementById('saveAccountButton'),
  deleteAccountLink: document.getElementById('deleteAccountLink'),
  accountStatus: document.getElementById('accountStatus'),
  accountTitle: document.getElementById('accountTitle'),
  partyForm: document.getElementById('partyForm'),
  requestQuoteButton: document.getElementById('requestQuoteButton'),
  partyStorageStatus: document.getElementById('partyStorageStatus'),
  savedPartyRequest: document.getElementById('savedPartyRequest'),
  savedPartyRequestDetails: document.getElementById('savedPartyRequestDetails'),
  editSavedPartyRequestButton: document.getElementById('editSavedPartyRequest'),
  addressFields: document.getElementById('addressFields'),
  cepInput: document.getElementById('cep'),
  cepStatus: document.getElementById('cepStatus'),
  addressInputs: ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado']
    .map((id) => document.getElementById(id)),
  menuToggle: document.querySelector('.menu-toggle'),
  navbarMenu: document.getElementById('navbarMenu'),
  serviceCards: document.querySelectorAll('.service-card[data-service]'),
  servicesSearch: document.getElementById('servicesSearch'),
  servicesSearchStatus: document.getElementById('servicesSearchStatus'),
  selectedServicesContainer: document.getElementById('selectedServices'),
  partyServicesCount: document.getElementById('partyServicesCount'),
  partyDetails: document.querySelector('.party-details'),
  screenSections: document.querySelectorAll('[data-screen]'),
  screenLinks: document.querySelectorAll('[data-nav-screen]'),
  installDialog: document.getElementById('installDialog'),
  installDialogMessage: document.getElementById('installDialogMessage'),
  installDialogHelp: document.getElementById('installDialogHelp'),
  confirmInstallButton: document.getElementById('confirmInstall'),
  dismissInstallButton: document.getElementById('dismissInstallDialog'),
  shareAppButton: document.getElementById('shareAppButton'),
  shareAppStatus: document.getElementById('shareAppStatus')
};
