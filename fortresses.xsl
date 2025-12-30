<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    
    <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>
    
    <xsl:template match="/">
        <html lang="bg">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Каталог на крепостите в България</title>
            <link rel="stylesheet" href="fortresses.css"/>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        </head>
        <body>
            
            <!-- HEADER -->
            <header class="site-header">
                <h1>Каталог на крепостите в България</h1>
                <p class="subtitle">Средновековни и древни крепости – семантичен уеб проект</p>
            </header>
            
            <main class="main-content">
                
                <!-- ГЛАВНА КАРТА -->
                <section class="main-map-section">
                    <h2>Карта на всички крепости</h2>
                    <div id="mainMap" class="main-map"></div>
                </section>
                
                <!-- КОНТРОЛИ -->
                <section class="controls">
                    <h2>⚙️</h2>
                    
                    <!-- ФИЛТРИРАНЕ -->
                    <div class="control-group">
                        <h3>🔍 Филтриране по тип</h3>
                        <div class="filter-types">
                            <div class="filter-card" onclick="filterByType('Българска')" data-type="Българска">Български</div>
                            <div class="filter-card" onclick="filterByType('Византийска')" data-type="Византийска">Византийски</div>
                            <div class="filter-card" onclick="filterByType('Римска')" data-type="Римска">Римски</div>
                            <div class="filter-card" onclick="filterByType('Тракийска')" data-type="Тракийска">Тракийски</div>
                        </div>
                    </div>
                    
                    <!-- СОРТИРАНЕ -->
                    <div class="control-group">
                        <h3>🔃 Сортиране</h3>
                        <div class="sorting">
                            <button onclick="sortFortresses('name')">Азбучен ред</button>
                            <button onclick="sortFortresses('preservation')">Запазеност</button>
                            <button onclick="sortFortresses('fee')">Входна такса</button>
                            <button onclick="sortFortresses('type')">Тип</button>
                        </div>
                    </div>
                </section>
                
                <!-- КРЕПОСТИ -->
                <section class="fortresses-section">
                    <h2 class="section-title">🏰 Крепости в България</h2>
                    <div id="fortressesGrid" class="fortresses-grid">
                        <xsl:apply-templates select="catalog/fortresses/fortress"/>
                    </div>
                </section>
                
            </main>
            
            <!-- FOOTER -->
            <footer class="site-footer">
                <p>
                    © 2026 Курсов проект по XML технологии за семантичен Уеб<br/>
                    Автори: Габриела Николова, Марк Кружков<br/>
                    СУ "Св. Климент Охридски" – ФМИ
                </p>
            </footer>
            
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script src="fortresses.js"></script>
        </body>
        </html>
    </xsl:template>
    
    <!-- TEMPLATE ЗА ВСЯКА КРЕПОСТ -->
    <xsl:template match="fortress">
        <xsl:variable name="fortressId" select="@id"/>
        <xsl:variable name="areaRef" select="location/areaRef"/>
        <xsl:variable name="regionRef" select="/catalog/areas/area[@id=$areaRef]/@regionRef"/>
        <xsl:variable name="imageName" select="substring-after(image, 'images/')"/>
        
        <article class="fortress-card" 
                 id="fortress_{$fortressId}"
                 data-id="{$fortressId}"
                 data-name="{name}"
                 data-type="{type}"
                 data-preservation="{preservation-status}"
                 data-fee="{visitor-info/entrance-fee/amount[@currency='BGN']}"
                 data-lat="{location/coordinates/latitude}"
                 data-lon="{location/coordinates/longitude}">
            
            <!-- СНИМКА -->
            <div class="fortress-image">
                <img src="{image}" alt="{n}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27
                 width=%27400%27 height=%27220%27%3E%3Crect fill=%27%23667%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 fill=%27%23fff%27
                  font-size=%2720%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3E{n}%3C/text%3E%3C/svg%3E'"/>
            </div>
            
            <!-- ЗАГЛАВИЕ -->
            <h2 class="fortress-title"><xsl:value-of select="name"/></h2>
            <hr/>
            
            <!-- ОСНОВНА ИНФОРМАЦИЯ -->
            <div class="info-box">
                <p><strong>Тип:</strong> <xsl:value-of select="type"/></p>
                <p><strong>Подтип:</strong> <xsl:value-of select="subtype"/></p>
                <p><strong>Регион:</strong> <xsl:value-of select="/catalog/regions/region[@id=$regionRef]/@name"/></p>
                <p><strong>Област:</strong> <xsl:value-of select="/catalog/areas/area[@id=$areaRef]/name"/></p>
                <p><strong>Град/Село:</strong> <xsl:value-of select="location/city"/></p>
            </div>
            
            <!-- ЗАПАЗЕНОСТ -->
            <div class="status-box">
                <strong>Запазеност:</strong>
                <span><xsl:value-of select="preservation-status"/></span>
            </div>
            
            <!-- ПЕРИОД -->
            <div class="period-box">
                <p><strong>Епоха на построяване:</strong> <xsl:value-of select="period/built-era"/></p>
                <p><strong>Основна употреба:</strong> <xsl:value-of select="period/main-use"/></p>
            </div>
            
            <!-- ОПИСАНИЕ -->
            <section class="description">
                <xsl:value-of select="normalize-space(description)"/>
            </section>
            
            <!-- ЗАБЕЛЕЖИТЕЛНОСТИ -->
            <section class="features">
                <h3>Забележителности</h3>
                <ul>
                    <xsl:for-each select="features/feature">
                        <li><xsl:value-of select="."/></li>
                    </xsl:for-each>
                </ul>
            </section>
            
            <!-- ИНФОРМАЦИЯ ЗА ПОСЕТИТЕЛИ -->
            <section class="visitor-box">
                <p><strong>💰 Входна такса:</strong> 
                    <xsl:value-of select="visitor-info/entrance-fee/amount[@currency='BGN']"/> лв
                    (<xsl:value-of select="visitor-info/entrance-fee/amount[@currency='EUR']"/> €)
                </p>
                <p><strong>🕐 Работно време:</strong> <xsl:value-of select="visitor-info/working-hours"/></p>
            </section>
            
            <!-- КАРТА -->
            <section class="map-box">
                <p><strong>📍 Координати:</strong> 
                    <xsl:value-of select="location/coordinates/latitude"/>, 
                    <xsl:value-of select="location/coordinates/longitude"/>
                </p>
                <div class="fortress-map" id="map_{$fortressId}"></div>
            </section>
            
        </article>
    </xsl:template>
    
</xsl:stylesheet>