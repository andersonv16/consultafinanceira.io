// ========================================
// CONFIGURAÇÃO DE APIs
// ========================================
const API_CONFIG = {
      brapi: {
        baseUrl: 'https://brapi.dev/api',
        token: 'bSEpRmEesGWZqBtyyMFKwu'
    },
    coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3'
    },
    awesomeapi: {
        baseUrl: 'https://economia.awesomeapi.com.br/json'
    }
};

// ========================================
// LOGOS PADRÃO PARA FALLBACK
// ========================================
const DEFAULT_LOGOS = {
    // Ações brasileiras
    'PETR4': 'https://raw.githubusercontent.com/thefintz/b3-assets/main/imgs/PETR4.png',
    'VALE3': 'https://raw.githubusercontent.com/thefintz/b3-assets/main/imgs/VALE3.png',
    'ITUB4': 'https://raw.githubusercontent.com/thefintz/b3-assets/main/imgs/ITUB4.png',
    'BBDC4': 'https://raw.githubusercontent.com/thefintz/b3-assets/main/imgs/BBDC4.png',
    'ABEV3': 'https://raw.githubusercontent.com/thefintz/b3-assets/main/imgs/ABEV3.png',
    'WEGE3': 'https://raw.githubusercontent.com/thefintz/b3-assets/main/imgs/WEGE3.png',
    
    // Logo genérico para ações
    'default_stock': 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="12" fill="%23001D3D"/%3E%3Ctext x="50%25" y="50%25" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="white"%3EB3%3C/text%3E%3C/svg%3E',
    
    // Logo genérico para fundos
    'default_fund': 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="12" fill="%23001D3D"/%3E%3Ctext x="50%25" y="50%25" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="white"%3EB3%3C/text%3E%3C/svg%3E',
    
    // Logo genérico para cripto
    'default_crypto': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%23f7931a"/%3E%3Ctext x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="14"%3E₿%3C/text%3E%3C/svg%3E'
};

// ========================================
// FUNÇÃO DE FALLBACK PARA IMAGENS
// ========================================
function getLogoWithFallback(logourl, symbol, type = 'stock') {
    // Se já existe uma URL, retorna ela
    if (logourl && logourl !== '' && !logourl.includes('placeholder')) {
        return logourl;
    }
    
    // Verifica se tem logo específica no DEFAULT_LOGOS
    if (DEFAULT_LOGOS[symbol]) {
        return DEFAULT_LOGOS[symbol];
    }
    
    // Retorna logo padrão baseado no tipo
    switch(type) {
        case 'fund':
            return DEFAULT_LOGOS['default_fund'];
        case 'crypto':
            return DEFAULT_LOGOS['default_crypto'];
        default:
            return DEFAULT_LOGOS['default_stock'];
    }
}

// Função para adicionar tratamento de erro de imagem ao DOM
function setupImageErrorHandling() {
    // Adiciona listener global para erros de imagem
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('asset-logo-img')) {
            const card = e.target.closest('.asset-card');
            if (card) {
                const symbolEl = card.querySelector('.asset-symbol');
                const symbol = symbolEl ? symbolEl.textContent : '';
                
                // Determina o tipo baseado na página
                let type = 'stock';
                if (window.location.href.includes('fundos')) type = 'fund';
                if (window.location.href.includes('criptomoedas')) type = 'crypto';
                
                e.target.src = getLogoWithFallback('', symbol, type);
            }
        }
    }, true);
}

// Inicializa tratamento de erro de imagens
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupImageErrorHandling);
} else {
    setupImageErrorHandling();
}

// ========================================
// GERENCIAMENTO DE FAVORITOS
// ========================================
const FavoritosManager = {
    STORAGE_KEY: 'ativos_favoritos',
    
    obterFavoritos() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    },
    
    adicionarFavorito(ativo) {
        const favoritos = this.obterFavoritos();
        if (!favoritos.find(f => f.symbol === ativo.symbol)) {
            favoritos.push({
                symbol: ativo.symbol,
                name: ativo.name,
                type: ativo.type,
                logourl: getLogoWithFallback(ativo.logourl, ativo.symbol, ativo.type),
                adicionadoEm: new Date().toISOString()
            });
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favoritos));
            return true;
        }
        return false;
    },
    
    removerFavorito(symbol) {
        const favoritos = this.obterFavoritos();
        const novos = favoritos.filter(f => f.symbol !== symbol);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(novos));
        return true;
    },
    
    isFavorito(symbol) {
        return this.obterFavoritos().some(f => f.symbol === symbol);
    },
    
    toggleFavorito(ativo) {
        if (this.isFavorito(ativo.symbol)) {
            this.removerFavorito(ativo.symbol);
            return false;
        } else {
            this.adicionarFavorito(ativo);
            return true;
        }
    }
};

// ========================================
// RELÓGIO DE MERCADO
// ========================================
function atualizarRelogioMercado() {
    const agora = new Date();
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataString = agora.toLocaleDateString('pt-BR', opcoes);
    const horaString = agora.toLocaleTimeString('pt-BR');
    
    const diaSemana = agora.getDay();
    const hora = agora.getHours();
    const mercadoAberto = (diaSemana >= 1 && diaSemana <= 5) && (hora >= 10 && hora < 17);
    
    const statusClass = mercadoAberto ? 'market-open' : 'market-closed';
    const statusText = mercadoAberto ? 'Mercado Aberto' : 'Mercado Fechado';
    
    const clockElement = document.getElementById('market-clock');
    if (clockElement) {
        clockElement.innerHTML = `
            ${dataString} | ${horaString} | 
            <span class="market-status ${statusClass}">
                <span class="status-dot"></span>
                <strong>${statusText}</strong>
            </span>
        `;
    }
}

// ========================================
// API: AÇÕES BRASILEIRAS (Brapi)
// ========================================
async function buscarAcoesBR(tickers = [], range = '1d') {
    const tickersStr = Array.isArray(tickers) ? tickers.join(',') : tickers;
    const url = `${API_CONFIG.brapi.baseUrl}/quote/${tickersStr}?range=${range}&interval=1d&token=${API_CONFIG.brapi.token}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro API: ${response.status}`);
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Erro ao buscar ações:', error);
        return [];
    }
}

async function buscarDetalheAcao(ticker) {
    const url = `${API_CONFIG.brapi.baseUrl}/quote/${ticker}?range=1mo&interval=1d&fundamental=true&dividends=true&token=${API_CONFIG.brapi.token}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro API: ${response.status}`);
        
        const data = await response.json();
        return data.results && data.results.length > 0 ? data.results[0] : null;
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        return null;
    }
}

// ========================================
// API: FUNDOS IMOBILIÁRIOS (Brapi)
// ========================================
async function buscarFundos(tickers = [], range = '1d') {
    return buscarAcoesBR(tickers, range);
}

async function buscarDetalheFundo(ticker) {
    return buscarDetalheAcao(ticker);
}

// ========================================
// API: CRIPTOMOEDAS (CoinGecko)
// ========================================
async function buscarDadosCripto(ids = ['bitcoin', 'ethereum']) {
    try {
        const idsStr = Array.isArray(ids) ? ids.join(',') : ids;
        const response = await fetch(
            `${API_CONFIG.coingecko.baseUrl}/simple/price?ids=${idsStr}&vs_currencies=usd,brl&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
        );
        
        if (!response.ok) throw new Error(`Erro API: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar cripto:', error);
        return null;
    }
}

async function buscarDetalheCripto(id) {
    try {
        const response = await fetch(
            `${API_CONFIG.coingecko.baseUrl}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`
        );
        
        if (!response.ok) throw new Error(`Erro API: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar detalhes cripto:', error);
        return null;
    }
}

// ========================================
// API: CÂMBIO (AwesomeAPI)
// ========================================
async function buscarCambio(moedas = ['USD-BRL']) {
    try {
        const moedasStr = Array.isArray(moedas) ? moedas.join(',') : moedas;
        const response = await fetch(`${API_CONFIG.awesomeapi.baseUrl}/last/${moedasStr}`);
        
        if (!response.ok) throw new Error(`Erro API: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar câmbio:', error);
        return null;
    }
}

// ========================================
// API: NOTÍCIAS (NewsAPI) - MELHORADA
// ========================================
async function buscarNoticias(pageSize = 2) {
    try {
        const hoje = new Date();
        const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dataFrom = umaSemanaAtras.toISOString().split('T')[0];
        const query = encodeURIComponent('(Bolsa OR Ibovespa OR B3 OR economia OR investimento) Brasil');
        
        // MUDANÇA AQUI: Chamamos o endpoint relativo do seu Worker
        const response = await fetch(
            `/get-news?q=${query}&from=${dataFrom}&pageSize=${pageSize}`
        );
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles) {
            return data.articles.filter(article => 
                article.urlToImage && 
                article.title && 
                article.title !== '[Removed]'
            );
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar notícias:', error);
        return null;
    }
}

// ========================================
// BUSCA UNIFICADA
// ========================================
// ========================================
// BUSCA UNIFICADA MELHORADA (config.js)
// ========================================
async function buscarAtivo(query) {
    query = query.toUpperCase().trim();
    if (!query) return null;

    // 1. Tenta identificar se é Cripto (BTC, ETH...)
    const criptoMap = {
        'BTC': 'bitcoin', 'BITCOIN': 'bitcoin',
        'ETH': 'ethereum', 'ETHEREUM': 'ethereum',
        'SOL': 'solana', 'SOLANA': 'solana'
    };
    
    if (criptoMap[query]) {
        const dados = await buscarDadosCripto([criptoMap[query]]);
        if (dados && dados[criptoMap[query]]) {
            return { type: 'cripto', data: dados[criptoMap[query]], id: criptoMap[query] };
        }
    }

    // 2. Busca Global na Brapi (Por Ticker ou Nome da Empresa)
    // Usamos o endpoint /quote/list com o parâmetro search para buscar em todo o mercado
    try {
        const urlBusca = `${API_CONFIG.brapi.baseUrl}/quote/list?search=${query}&token=${API_CONFIG.brapi.token}`;
        const res = await fetch(urlBusca);
        const data = await res.json();

        // Se encontrou algo na listagem geral
        if (data.stocks && data.stocks.length > 0) {
            // Pegamos o ticker exato do primeiro resultado para buscar os dados detalhados (preço, volume)
            const tickerEncontrado = data.stocks[0].stock;
            const detalhes = await buscarAcoesBR([tickerEncontrado]);
            
            if (detalhes && detalhes.length > 0) {
                return {
                    type: detalhes[0].symbol.includes('11') ? 'fundo' : 'acao',
                    data: detalhes[0]
                };
            }
        }
    } catch (error) {
        console.error('Erro na busca global Brapi:', error);
    }
    
    return null;
}

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================
function formatarMoeda(valor, moeda = 'BRL') {
    if (!valor && valor !== 0) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: moeda,
        minimumFractionDigits: 2
    }).format(valor);
}

function formatarNumero(valor, decimais = 2) {
    if (!valor && valor !== 0) return 'N/A';
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais
    });
}

function formatarVolume(volume) {
    if (!volume) return "0";
    if (volume >= 1_000_000_000) return (volume / 1_000_000_000).toFixed(1) + 'B';
    if (volume >= 1_000_000) return (volume / 1_000_000).toFixed(1) + 'M';
    if (volume >= 1_000) return (volume / 1_000).toFixed(1) + 'K';
    return volume.toString();
}

function formatarMarketCap(valor) {
    if (!valor) return 'N/A';
    if (valor >= 1_000_000_000) return 'R$ ' + (valor / 1_000_000_000).toFixed(2) + 'B';
    if (valor >= 1_000_000) return 'R$ ' + (valor / 1_000_000).toFixed(2) + 'M';
    return formatarMoeda(valor);
}

function calcularTempoAtras(dataISO) {
    const agora = new Date();
    const passado = new Date(dataISO);
    const diffMs = agora - passado;
    const diffSeg = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSeg / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHrs / 24);
    
    if (diffDias > 0) return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`;
    if (diffHrs > 0) return `${diffHrs}h atrás`;
    if (diffMin > 0) return `${diffMin}min atrás`;
    return 'Agora mesmo';
}

function obterClasseVariacao(valor) {
    return valor >= 0 ? 'text-success' : 'text-danger';
}

function obterSeta(valor) {
    return valor >= 0 ? '▲' : '▼';
}

// ========================================
// MODAL GENÉRICO
// ========================================
function criarModal(titulo, conteudo) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${titulo}</h2>
                <button class="modal-close" onclick="fecharModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                ${conteudo}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal(modal.querySelector('.modal-close'));
        }
    });
    
    return modal;
}

function fecharModal(botao) {
    const modal = botao.closest('.modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200);
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        atualizarRelogioMercado();
        setInterval(atualizarRelogioMercado, 1000);
    });
} else {
    atualizarRelogioMercado();
    setInterval(atualizarRelogioMercado, 1000);
}
// ========================================
// BUSCA DE RANKING GLOBAL (config.js)
// ========================================
async function buscarRankingMercado(criterio = 'change', direcao = 'desc') {
    // criterio: 'change' (variação), 'volume' (volume financeiro)
    // direcao: 'desc' (maiores/altas), 'asc' (menores/baixas)
    const url = `${API_CONFIG.brapi.baseUrl}/quote/list?sortBy=${criterio}&sortOrder=${direcao}&limit=100&token=${API_CONFIG.brapi.token}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar ranking");
        const data = await response.json();
        
        // Retorna apenas os tickers encontrados no ranking
        return data.stocks ? data.stocks.map(s => s.stock) : [];
    } catch (error) {
        console.error('Erro no ranking:', error);
        return [];
    }
}
// No seu config.js
async function buscarRankingCripto(criterio = 'market_cap_desc') {
    // criterios: 'market_cap_desc', 'volume_desc', 'id_desc'
    const url = `${API_CONFIG.coingecko.baseUrl}/coins/markets?vs_currency=usd&order=${criterio}&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro CoinGecko");
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar ranking cripto:', error);
        return null;
    }
}