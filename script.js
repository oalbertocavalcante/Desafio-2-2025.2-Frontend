// variaveis globais
const urlbase = 'https://servicodados.ibge.gov.br/api/v1/localidades';
let listaCompleta = [];
let listaFiltrada = [];
let ordem = true;
let paginaAtual = 1;
const itensPorPagina = 50;

// elementos do DOM
const selectEstado = document.getElementById('estado');
const inputPesquisa = document.getElementById('pesquisa');
const tabelaCorpo = document.getElementById('corpo');
const divCarregando = document.getElementById('carregando');
const divMensagem = document.getElementById('mensagem');
const spanContador = document.getElementById('contador');
const botaoOrdenar = document.getElementById('ordenar');
const botaoAnterior = document.getElementById('anterior');
const botaoProximo = document.getElementById('proximo');
const spanPagina = document.getElementById('pagina');

// inicializa a aplicacao
function iniciar() {
    carregarEstados();
    adicionarEventos();
}

// adiciona os eventos aos elementos
function adicionarEventos() {
    selectEstado.addEventListener('change', mudarEstado);
    inputPesquisa.addEventListener('input', filtrar);
    botaoOrdenar.addEventListener('click', ordenar);
    botaoAnterior.addEventListener('click', voltarPagina);
    botaoProximo.addEventListener('click', avancarPagina);
}

// carrega a lista de estados
async function carregarEstados() {
    try {
        mostrarCarregando(true);
        const resposta = await fetch(`${urlbase}/estados?orderBy=nome`);
        
        if (!resposta.ok) {
            throw new Error('Erro ao buscar estados');
        }
        
        const estados = await resposta.json();
        preencherEstados(estados);
        mostrarCarregando(false);
    } catch (erro) {
        mostrarErro('Erro ao carregar estados. Tente novamente.');
        mostrarCarregando(false);
    }
}

// preenche o select com os estados
function preencherEstados(estados) {
    estados.forEach(estado => {
        const opcao = document.createElement('option');
        opcao.value = estado.sigla;
        opcao.textContent = `${estado.sigla} - ${estado.nome}`;
        selectEstado.appendChild(opcao);
    });
}

// evento de mudanca de estado
async function mudarEstado() {
    const sigla = selectEstado.value;
    
    if (!sigla) {
        limparTabela();
        return;
    }
    
    await carregarMunicipios(sigla);
}

// carrega os municipios do estado selecionado
async function carregarMunicipios(sigla) {
    try {
        mostrarCarregando(true);
        esconderMensagem();
        
        const resposta = await fetch(`${urlbase}/estados/${sigla}/municipios`);
        
        if (!resposta.ok) {
            throw new Error('Erro ao buscar municipios');
        }
        
        const municipios = await resposta.json();
        listaCompleta = municipios;
        listaFiltrada = municipios;
        paginaAtual = 1;
        
        exibirMunicipios();
        atualizarContador();
        mostrarCarregando(false);
    } catch (erro) {
        mostrarErro('Erro ao carregar municipios. Verifique sua conexao.');
        mostrarCarregando(false);
    }
}

// exibe os municipios na tabela com paginacao
function exibirMunicipios() {
    limparTabela();
    esconderMensagem();
    
    if (listaFiltrada.length === 0) {
        mostrarErro('Nenhum municipio encontrado.');
        spanContador.textContent = '';
        return;
    }
    
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const municipiosPagina = listaFiltrada.slice(inicio, fim);
    
    municipiosPagina.forEach(municipio => {
        const linha = document.createElement('tr');
        
        const colunaCodigo = document.createElement('td');
        colunaCodigo.textContent = municipio.id;
        
        const colunaNome = document.createElement('td');
        colunaNome.textContent = municipio.nome;
        
        linha.appendChild(colunaCodigo);
        linha.appendChild(colunaNome);
        tabelaCorpo.appendChild(linha);
    });
    
    atualizarPaginacao();
}

// filtra os municipios pela pesquisa
function filtrar() {
    const termo = inputPesquisa.value.toLowerCase().trim();
    
    if (termo === '') {
        listaFiltrada = listaCompleta;
    } else {
        listaFiltrada = listaCompleta.filter(municipio => 
            municipio.nome.toLowerCase().includes(termo)
        );
    }
    
    paginaAtual = 1;
    exibirMunicipios();
    atualizarContador();
}

// ordena a lista de municipios
function ordenar() {
    ordem = !ordem;
    
    listaFiltrada.sort((a, b) => {
        if (ordem) {
            return a.nome.localeCompare(b.nome);
        } else {
            return b.nome.localeCompare(a.nome);
        }
    });
    
    botaoOrdenar.textContent = ordem ? 'Ordenar Z-A' : 'Ordenar A-Z';
    exibirMunicipios();
}

// atualiza o contador de municipios
function atualizarContador() {
    if (listaFiltrada.length > 0) {
        spanContador.textContent = `Total: ${listaFiltrada.length} municipios encontrados`;
    } else {
        spanContador.textContent = '';
    }
}

// atualiza os controles de paginacao
function atualizarPaginacao() {
    const totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina);
    
    if (totalPaginas > 1) {
        spanPagina.textContent = `Pagina ${paginaAtual} de ${totalPaginas}`;
        botaoAnterior.classList.remove('escondido');
        botaoProximo.classList.remove('escondido');
        
        botaoAnterior.disabled = paginaAtual === 1;
        botaoProximo.disabled = paginaAtual === totalPaginas;
    } else {
        spanPagina.textContent = '';
        botaoAnterior.classList.add('escondido');
        botaoProximo.classList.add('escondido');
    }
}

// avanca para a proxima pagina
function avancarPagina() {
    paginaAtual++;
    exibirMunicipios();
}

// volta para a pagina anterior
function voltarPagina() {
    paginaAtual--;
    exibirMunicipios();
}

// limpa a tabela
function limparTabela() {
    tabelaCorpo.innerHTML = '';
    spanContador.textContent = '';
    spanPagina.textContent = '';
    botaoAnterior.classList.add('escondido');
    botaoProximo.classList.add('escondido');
}

// mostra ou esconde o carregamento
function mostrarCarregando(mostrar) {
    if (mostrar) {
        divCarregando.classList.remove('escondido');
    } else {
        divCarregando.classList.add('escondido');
    }
}

// mostra mensagem de erro
function mostrarErro(texto) {
    divMensagem.textContent = texto;
    divMensagem.className = 'mensagem erro';
    divMensagem.classList.remove('escondido');
}

// esconde a mensagem
function esconderMensagem() {
    divMensagem.classList.add('escondido');
}

// inicia quando a pagina carregar
window.addEventListener('DOMContentLoaded', iniciar);
