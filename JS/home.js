// ========================================
// HOME.JS - Página Inicial Melhorada 2026
// ========================================

// ========================================
// ATUALIZAR TICKER
// ========================================
async function atualizarTicker() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;
    
    try {
        const [cripto, acoes, cambio] = await Promise.all([
            buscarDadosCripto(['bitcoin', 'ethereum', 'solana']),
            buscarAcoesBR(['^BVSP', 'PETR4', 'VALE3', 'ITUB4']),
            buscarCambio(['USD-BRL', 'EUR-BRL'])
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
        
        // EUR/BRL
        if (cambio && cambio.EURBRL) {
            const eur = cambio.EURBRL;
            items.push({
                symbol: 'EUR/BRL',
                price: `R$ ${parseFloat(eur.bid).toFixed(2)}`,
                change: `${parseFloat(eur.pctChange) >= 0 ? '+' : ''}${parseFloat(eur.pctChange).toFixed(2)}%`,
                positive: parseFloat(eur.pctChange) >= 0
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
                    price: `$${formatarNumero(cripto.solana.usd, 2)}`,
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

// ========================================
// ATUALIZAR STATS CARDS
// ========================================
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

// ========================================
// CARREGAR NOTÍCIAS
// ========================================
async function carregarNoticias() {
    const container = document.getElementById('news-container');
    if (!container) return;

    container.innerHTML = `
        <div class="news-card-skeleton"></div>
            `;

    try {
        const artigos = await buscarNoticias('(B3 OR Bovespa OR "mercado de ações" OR "fundos imobiliários" OR economia) AND Brasil', 4);

        if (artigos && artigos.length > 0) {
            container.innerHTML = artigos.map(noticia => `
                <div class="news-card animate-fadeInUp" onclick="window.open('${noticia.url}', '_blank')">
                    <div class="news-image-container">
                        <img src="${noticia.urlToImage || 'https://images.unsplash.com/photo-1611974717482-58a252bc14ee?w=400'}" 
                             alt="${noticia.title}" 
                             class="news-image"
                             onerror="this.src='https://images.unsplash.com/photo-1611974717482-58a252bc14ee?w=400'">
                    </div>
                    <div class="news-content">
                        <div class="news-title">${noticia.title}</div>
                        <div class="news-meta">
                            <span class="news-source">${noticia.source.name}</span>
                            <span class="news-time">${calcularTempoAtras(noticia.publishedAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            usarNoticiasFallback(container);
        }
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        usarNoticiasFallback(container);
    }
}

function usarNoticiasFallback(container) {
    const noticiasFallback = [
        {
            title: "Mercado Financeiro Brasileiro em Crescimento",
            source: "Portal Financeiro",
            time: "2 horas atrás",
            image: "https://images.unsplash.com/photo-1611974717482-58a252bc14ee?w=400",
            url: "https://www.b3.com.br"
        },
        {
            title: "B3 Registra Aumento no Volume de Negociações",
            source: "Economia Brasil",
            time: "5 horas atrás",
            image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
            url: "https://www.b3.com.br"
        },
        {
            title: "Novidades no Mercado de Capitais",
            source: "Investidor News",
            time: "1 dia atrás",
            image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400",
            url: "https://www.b3.com.br"
        }
    ];
    
    container.innerHTML = noticiasFallback.map(noticia => `
        <div class="news-card" onclick="window.open('${noticia.url}', '_blank')">
            <div class="news-image-container">
                <img src="${noticia.image}" alt="${noticia.title}" class="news-image">
            </div>
            <div class="news-content">
                <div class="news-title">${noticia.title}</div>
                <div class="news-meta">
                    <span class="news-source">${noticia.source}</span>
                    <span class="news-time">${noticia.time}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// INICIALIZAÇÃO
// ========================================
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
