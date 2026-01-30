// ========== HOME PAGE SCRIPTS ==========

// ========== ATUALIZAR TICKER ==========
async function atualizarTicker() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;
    
    try {
        const [cripto, acoes, cambio] = await Promise.all([
            buscarDadosCripto(['bitcoin', 'ethereum', 'solana']),
            buscarAcoesBR(['^BVSP', 'PETR4', 'VALE3']),
            buscarCambio(['USD-BRL'])
        ]);
        
        const items = [];
        
        // IBOVESPA
        if (acoes && acoes.length > 0) {
            const ibov = acoes.find(a => a.symbol === '^BVSP');
            if (ibov) {
                items.push({
                    symbol: 'IBOV',
                    price: formatarNumero(ibov.regularMarketPrice, 2),
                    change: `${ibov.regularMarketChangePercent >= 0 ? '+' : ''}${ibov.regularMarketChangePercent.toFixed(2)}%`,
                    positive: ibov.regularMarketChangePercent >= 0
                });
            }
        }
        
        // USD/BRL
        if (cambio && cambio.USDBRL) {
            const usd = cambio.USDBRL;
            items.push({
                symbol: 'USD/BRL',
                price: `R$ ${parseFloat(usd.bid).toFixed(2)}`,
                change: `${parseFloat(usd.pctChange) >= 0 ? '+' : ''}${parseFloat(usd.pctChange).toFixed(2)}%`,
                positive: parseFloat(usd.pctChange) >= 0
            });
        }
        
        // Criptomoedas
        if (cripto) {
            if (cripto.bitcoin) {
                items.push({
                    symbol: 'BTC',
                    price: `$${formatarNumero(cripto.bitcoin.usd, 0)}`,
                    change: `${cripto.bitcoin.usd_24h_change >= 0 ? '+' : ''}${cripto.bitcoin.usd_24h_change.toFixed(2)}%`,
                    positive: cripto.bitcoin.usd_24h_change >= 0
                });
            }
            if (cripto.ethereum) {
                items.push({
                    symbol: 'ETH',
                    price: `$${formatarNumero(cripto.ethereum.usd, 0)}`,
                    change: `${cripto.ethereum.usd_24h_change >= 0 ? '+' : ''}${cripto.ethereum.usd_24h_change.toFixed(2)}%`,
                    positive: cripto.ethereum.usd_24h_change >= 0
                });
            }
            if (cripto.solana) {
                items.push({
                    symbol: 'SOL',
                    price: `$${formatarNumero(cripto.solana.usd, 0)}`,
                    change: `${cripto.solana.usd_24h_change >= 0 ? '+' : ''}${cripto.solana.usd_24h_change.toFixed(2)}%`,
                    positive: cripto.solana.usd_24h_change >= 0
                });
            }
        }
        
        // Ações brasileiras
        if (acoes && acoes.length > 0) {
            acoes.filter(a => a.symbol !== '^BVSP').forEach(acao => {
                items.push({
                    symbol: acao.symbol,
                    price: formatarMoeda(acao.regularMarketPrice),
                    change: `${acao.regularMarketChangePercent >= 0 ? '+' : ''}${acao.regularMarketChangePercent.toFixed(2)}%`,
                    positive: acao.regularMarketChangePercent >= 0
                });
            });
        }
        
        if (items.length > 0) {
            const tickerHTML = items.concat(items).map(item => `
                <div class="ticker-item">
                    <span class="ticker-symbol">${item.symbol}</span>
                    <span class="ticker-price">${item.price}</span>
                    <span class="ticker-change ${item.positive ? 'badge-success' : 'badge-danger'}">${item.change}</span>
                </div>
            `).join('');
            
            tickerContent.innerHTML = tickerHTML;
        }
    } catch (error) {
        console.error('Erro ao atualizar ticker:', error);
    }
}

// ========== ATUALIZAR STATS CARDS ==========
async function atualizarStatsCards() {
    try {
        const [cripto, acoes, cambio] = await Promise.all([
            buscarDadosCripto(['bitcoin', 'ethereum']),
            buscarAcoesBR(['^BVSP']),
            buscarCambio(['USD-BRL'])
        ]);
        
        // IBOVESPA
        if (acoes && acoes.length > 0) {
            const ibov = acoes[0];
            const ibovValue = document.getElementById('ibov-value');
            const ibovChange = document.getElementById('ibov-change');
            
            if (ibovValue) ibovValue.textContent = formatarNumero(ibov.regularMarketPrice, 2);
            if (ibovChange) {
                const change = ibov.regularMarketChangePercent;
                ibovChange.innerHTML = `
                    <span class="${obterClasseVariacao(change)}">
                        ${obterSeta(change)} ${Math.abs(change).toFixed(2)}%
                    </span>
                `;
            }
        }
        
        // USD/BRL
        if (cambio && cambio.USDBRL) {
            const usd = cambio.USDBRL;
            const usdValue = document.getElementById('usd-value');
            const usdChange = document.getElementById('usd-change');
            
            if (usdValue) usdValue.textContent = `R$ ${parseFloat(usd.bid).toFixed(2)}`;
            if (usdChange) {
                const change = parseFloat(usd.pctChange);
                usdChange.innerHTML = `
                    <span class="${obterClasseVariacao(change)}">
                        ${obterSeta(change)} ${Math.abs(change).toFixed(2)}%
                    </span>
                `;
            }
        }
        
        // Bitcoin
        if (cripto && cripto.bitcoin) {
            const btc = cripto.bitcoin;
            const btcValue = document.getElementById('btc-value');
            const btcChange = document.getElementById('btc-change');
            
            if (btcValue) btcValue.textContent = `$${formatarNumero(btc.usd, 0)}`;
            if (btcChange) {
                const change = btc.usd_24h_change;
                btcChange.innerHTML = `
                    <span class="${obterClasseVariacao(change)}">
                        ${obterSeta(change)} ${Math.abs(change).toFixed(2)}% (24h)
                    </span>
                `;
            }
        }
        
        // Ethereum
        if (cripto && cripto.ethereum) {
            const eth = cripto.ethereum;
            const ethValue = document.getElementById('eth-value');
            const ethChange = document.getElementById('eth-change');
            
            if (ethValue) ethValue.textContent = `$${formatarNumero(eth.usd, 0)}`;
            if (ethChange) {
                const change = eth.usd_24h_change;
                ethChange.innerHTML = `
                    <span class="${obterClasseVariacao(change)}">
                        ${obterSeta(change)} ${Math.abs(change).toFixed(2)}% (24h)
                    </span>
                `;
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar stats cards:', error);
    }
}

// ========== CARREGAR NOTÍCIAS ==========
async function carregarNoticias() {
    const container = document.getElementById('news-container');
    if (!container) return;
    
    try {
        const noticias = await buscarNoticias('(bolsa OR mercado OR ações OR investimentos) brasil', 6);
        
        if (noticias && noticias.length > 0) {
            const noticiasHTML = noticias.map(article => {
                const timeAgo = calcularTempoAtras(article.publishedAt);
                const imgUrl = article.urlToImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop';
                
                return `
                    <div class="news-card" onclick="window.open('${article.url}', '_blank')">
                        <img 
                            src="${imgUrl}" 
                            alt="${article.title}" 
                            class="news-image" 
                            onerror="this.src='https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop'"
                        >
                        <div class="news-content">
                            <div class="news-title">${article.title}</div>
                            <div class="news-meta">
                                <span class="news-source">${article.source.name}</span>
                                <span class="news-time">${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = noticiasHTML;
        } else {
            throw new Error('Sem notícias disponíveis');
        }
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        carregarNoticiasEstaticas();
    }
}

function carregarNoticiasEstaticas() {
    const container = document.getElementById('news-container');
    if (!container) return;
    
    const noticias = [
        { 
            titulo: "Ibovespa fecha em alta com otimismo sobre juros nos EUA", 
            fonte: "InfoMoney", 
            tempo: "2h atrás", 
            imagem: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
            url: "#"
        },
        { 
            titulo: "Petrobras anuncia novo programa de dividendos extraordinários", 
            fonte: "Valor Econômico", 
            tempo: "4h atrás", 
            imagem: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
            url: "#"
        },
        { 
            titulo: "Fundos imobiliários batem recorde de captação em janeiro", 
            fonte: "Brazil Journal", 
            tempo: "6h atrás", 
            imagem: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop",
            url: "#"
        },
        { 
            titulo: "Bitcoin ultrapassa US$ 100 mil com expectativa de ETFs", 
            fonte: "CoinTelegraph", 
            tempo: "8h atrás", 
            imagem: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop",
            url: "#"
        },
        { 
            titulo: "Banco Central mantém Selic em 13,75% ao ano", 
            fonte: "G1 Economia", 
            tempo: "10h atrás", 
            imagem: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&h=200&fit=crop",
            url: "#"
        },
        { 
            titulo: "Vale anuncia investimento bilionário em energia renovável", 
            fonte: "Estadão", 
            tempo: "12h atrás", 
            imagem: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=200&fit=crop",
            url: "#"
        }
    ];

    container.innerHTML = noticias.map(n => `
        <div class="news-card" onclick="window.open('${n.url}', '_blank')">
            <img src="${n.imagem}" alt="${n.titulo}" class="news-image">
            <div class="news-content">
                <div class="news-title">${n.titulo}</div>
                <div class="news-meta">
                    <span class="news-source">${n.fonte}</span>
                    <span class="news-time">${n.tempo}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async function() {
    // Carregar dados iniciais
    await Promise.all([
        atualizarStatsCards(),
        atualizarTicker(),
        carregarNoticias()
    ]);
    
    // Atualizar dados de mercado a cada 60 segundos
    setInterval(async () => {
        await atualizarStatsCards();
        await atualizarTicker();
    }, 60000);
    
    // Atualizar notícias a cada 5 minutos
    setInterval(carregarNoticias, 300000);
});
