<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <header class="site-header">
      <h1>Каталог на крепостите в България</h1>
      <p class="subtitle">Средновековни и древни крепости</p>
    </header>

    <main class="main-content">
      <section class="map-section">
        <h2>Карта на всички крепости</h2>
        <div id="mainMap" style="height:500px;margin:2rem 0;border-radius:10px;"></div>
      </section>

      <section class="controls">
        <h2>Сортиране и филтриране</h2>
        <div class="filter-types">
          <div class="filter-card" data-type="Българска">Български</div>
          <div class="filter-card" data-type="Византийска">Византийски</div>
          <div class="filter-card" data-type="Римска">Римски</div>
          <div class="filter-card" data-type="Тракийска">Тракийски</div>
        </div>

        <div class="sorting">
          <button data-sort="name">Азбучен ред</button>
          <button data-sort="preservation">Запазеност</button>
          <button data-sort="fee">Входна такса</button>
          <button data-sort="type">Тип</button>
        </div>
      </section>

      <section class="fortresses-section">
        <div id="fortressesGrid" class="fortresses-grid">

          <xsl:for-each select="/catalog//fortress">
            <article class="fortress-card"
                data-id="{@id}"
                data-name="{normalize-space(name)}"
                data-type="{normalize-space(type)}"
                data-preservation="{normalize-space(preservation-status)}"
                data-fee="{normalize-space(visitor-info/entrance-fee/amount[@currency='BGN'])}"
                data-lat="{normalize-space(location/coordinates/latitude)}"
                data-lon="{normalize-space(location/coordinates/longitude)}"
            >   
                <h2 class="fortress-title"><xsl:value-of select="name"/></h2>
            </article>
          </xsl:for-each>

        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>© 2026</p>
    </footer>
  </xsl:template>
</xsl:stylesheet>
