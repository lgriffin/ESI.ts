import{_ as a,o as i,c as n,a2 as e}from"./chunks/framework.YiAtXB4p.js";const E=JSON.parse('{"title":"SDE Module Architecture","description":"","frontmatter":{"title":"SDE Module Architecture","sourceFile":"guides/sde/ARCHITECTURE.md"},"headers":[],"relativePath":"guide/sde-architecture.md","filePath":"guide/sde-architecture.md"}'),t={name:"guide/sde-architecture.md"};function l(p,s,r,o,d,h){return i(),n("div",null,[...s[0]||(s[0]=[e(`<h1 id="sde-module-architecture" tabindex="-1">SDE Module Architecture <a class="header-anchor" href="#sde-module-architecture" aria-label="Permalink to &quot;SDE Module Architecture&quot;">​</a></h1><p>The SDE (Static Data Export) module provides typed, in-memory access to CCP&#39;s EVE Online static game data. It reads YAML files natively from disk into <code>Map</code>-based storage with no database intermediary. 109 entity types, 110 Zod schemas, ~100 typed query methods covering all 102 SDE YAML files.</p><h2 id="1-system-context-c4-level-1" tabindex="-1">1. System Context (C4 Level 1) <a class="header-anchor" href="#1-system-context-c4-level-1" aria-label="Permalink to &quot;1. System Context (C4 Level 1)&quot;">​</a></h2><div class="language-mermaid vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">mermaid</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">C4Context</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    title SDE Module - System Context</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Person(dev, &quot;Developer&quot;, &quot;EVE Online tool/app developer&quot;)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    System(sde, &quot;SDE Module&quot;, &quot;Typed in-memory provider for EVE static data. 109 entity types, ~100 query methods.&quot;)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    System_Ext(ccp_sde, &quot;CCP SDE&quot;, &quot;Static Data Export: 102 YAML files published by CCP (~200 MB ZIP)&quot;)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(dev, sde, &quot;Queries static data&quot;, &quot;TypeScript API&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(sde, ccp_sde, &quot;Downloads &amp; parses&quot;, &quot;HTTPS + js-yaml&quot;)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    UpdateLayoutConfig($c4ShapeInRow=&quot;3&quot;, $c4BoundaryInRow=&quot;1&quot;)</span></span></code></pre></div><h2 id="2-container-diagram-c4-level-2" tabindex="-1">2. Container Diagram (C4 Level 2) <a class="header-anchor" href="#2-container-diagram-c4-level-2" aria-label="Permalink to &quot;2. Container Diagram (C4 Level 2)&quot;">​</a></h2><div class="language-mermaid vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">mermaid</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">C4Container</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    title SDE Module - Container View</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Container_Boundary(sde_module, &quot;SDE Module (src/sde/)&quot;) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(provider, &quot;SdeDataProvider&quot;, &quot;TypeScript class&quot;, &quot;Core provider. Loads YAML, normalizes fields, stores in Maps. ~100 typed query methods.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(interface, &quot;IStaticDataProvider&quot;, &quot;TypeScript interface&quot;, &quot;97-method contract. Decouples consumers from implementation.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(memory, &quot;MemorySdeProvider&quot;, &quot;TypeScript class&quot;, &quot;In-memory test double. Accepts typed arrays, implements full interface.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(types, &quot;Entity Types&quot;, &quot;109 TypeScript interfaces&quot;, &quot;Strongly typed interfaces for all SDE entities (EveType, SolarSystem, Blueprint, etc.)&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(schemas, &quot;Zod Schemas&quot;, &quot;110 z.looseObject schemas&quot;, &quot;Runtime validation. Preserves extra fields from SDE.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(factory, &quot;SdeTestDataFactory&quot;, &quot;TypeScript class&quot;, &quot;Generates realistic test fixtures for all entity types.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Container_Boundary(ingestion, &quot;Ingestion Pipeline (src/sde/ingestion/)&quot;) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(downloader, &quot;SdeDownloader&quot;, &quot;TypeScript class&quot;, &quot;Downloads CCP SDE ZIP via native fetch. Checks latest build number.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(extractor, &quot;SdeExtractor&quot;, &quot;TypeScript class&quot;, &quot;Extracts/parses YAML from ZIP using adm-zip + js-yaml.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(transforms, &quot;Transforms&quot;, &quot;TypeScript functions&quot;, &quot;Field normalization, locale extraction, recursive nested normalization.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Container(constants, &quot;SDE_FILE_REGISTRY&quot;, &quot;102-entry config array&quot;, &quot;Maps each YAML file to table name, PK attribute, ID type, and injection flag.&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(provider, interface, &quot;implements&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(memory, interface, &quot;implements&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(provider, transforms, &quot;uses for field normalization&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(provider, constants, &quot;iterates registry to load files&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(provider, extractor, &quot;uses for ZIP loading (fromZip)&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(provider, types, &quot;casts records to&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Rel(schemas, types, &quot;validates against&quot;)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    UpdateLayoutConfig($c4ShapeInRow=&quot;3&quot;, $c4BoundaryInRow=&quot;1&quot;)</span></span></code></pre></div><h2 id="3-component-diagram-c4-level-3---sdedataprovider-internals" tabindex="-1">3. Component Diagram (C4 Level 3) - SdeDataProvider Internals <a class="header-anchor" href="#3-component-diagram-c4-level-3---sdedataprovider-internals" aria-label="Permalink to &quot;3. Component Diagram (C4 Level 3) - SdeDataProvider Internals&quot;">​</a></h2><div class="language-mermaid vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">mermaid</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">graph TB</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    subgraph SdeDataProvider</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        direction TB</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        subgraph Storage</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            entities[&quot;entities: Map&amp;lt;tableName, Map&amp;lt;id, Record&amp;gt;&amp;gt;&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            fkIndexes[&quot;fkIndexes: Map&amp;lt;tableName:field, Map&amp;lt;fkValue, Record[]&amp;gt;&amp;gt;&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        end</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        subgraph &quot;Factory Methods&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            fromDir[&quot;fromDirectory(path)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            fromZip[&quot;fromZip(path)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        end</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        subgraph &quot;Load Pipeline&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            loadRecords[&quot;loadRecords(spec, rawYaml)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            transform[&quot;transformRecordNative()&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            normalize[&quot;normalizeSdeFieldName()&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            locale[&quot;extractLocale()&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            nested[&quot;normalizeNested()&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        end</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        subgraph &quot;Query Methods&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            getById[&quot;getById&amp;lt;T&amp;gt;(table, id)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            getByFk[&quot;getByFk&amp;lt;T&amp;gt;(table, field, value)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            getAllRecords[&quot;getAllRecords&amp;lt;T&amp;gt;(table)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            search[&quot;search&amp;lt;T&amp;gt;(table, field, query, limit)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            filterBy[&quot;filterBy&amp;lt;T&amp;gt;(table, predicate)&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        end</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    end</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    fromDir --&gt;|&quot;reads YAML files&quot;| loadRecords</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    fromZip --&gt;|&quot;extracts from ZIP&quot;| loadRecords</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    loadRecords --&gt;|&quot;per record&quot;| transform</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    transform --&gt; normalize</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    transform --&gt; locale</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    transform --&gt;|&quot;nested objects&quot;| nested</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    nested --&gt;|&quot;recursive&quot;| normalize</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    nested --&gt;|&quot;locale maps&quot;| locale</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    loadRecords --&gt;|&quot;stores&quot;| entities</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    getById --&gt;|&quot;direct lookup&quot;| entities</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    getByFk --&gt;|&quot;lazy build + cache&quot;| fkIndexes</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    fkIndexes -.-&gt;|&quot;built from&quot;| entities</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    getAllRecords --&gt;|&quot;values iterator&quot;| entities</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    search --&gt;|&quot;linear scan&quot;| entities</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    filterBy --&gt;|&quot;predicate scan&quot;| entities</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    style entities fill:#4a9eff,color:#fff</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    style fkIndexes fill:#ff9f43,color:#fff</span></span></code></pre></div><h2 id="4-data-flow" tabindex="-1">4. Data Flow <a class="header-anchor" href="#4-data-flow" aria-label="Permalink to &quot;4. Data Flow&quot;">​</a></h2><div class="language-mermaid vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">mermaid</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">sequenceDiagram</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant CLI as sde-ingest.ts</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant DL as SdeDownloader</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant EX as SdeExtractor</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant FS as Filesystem</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant DP as SdeDataProvider</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant TR as transformRecordNative</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    participant MAP as Entity Maps</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Note over CLI,MAP: Ingestion (one-time setup)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    CLI-&gt;&gt;DL: download(outputPath)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DL-&gt;&gt;DL: fetch ZIP from CCP (~200MB)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DL--&gt;&gt;CLI: sde-data.zip</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    CLI-&gt;&gt;EX: extractAll(zipPath, outputDir)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    EX-&gt;&gt;FS: write 102 YAML files to sde-data/</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    CLI-&gt;&gt;FS: delete ZIP</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Note over CLI,MAP: Loading (per application start)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    CLI-&gt;&gt;DP: fromDirectory(&quot;./sde-data&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP-&gt;&gt;FS: read _sde.yaml (metadata)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    loop For each spec in SDE_FILE_REGISTRY</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        DP-&gt;&gt;FS: readFileSync(yamlFile)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        FS--&gt;&gt;DP: raw YAML string</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        DP-&gt;&gt;DP: yaml.load() to parsed object</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        loop For each [id, record] in parsed</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            DP-&gt;&gt;TR: transformRecordNative(id, record, spec)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            TR-&gt;&gt;TR: normalizeSdeFieldName (groupID to groupId)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            TR-&gt;&gt;TR: extractLocale ({en: &quot;Jita&quot;} to &quot;Jita&quot;)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            TR-&gt;&gt;TR: normalizeNested (recursive for objects/arrays)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            TR--&gt;&gt;DP: normalized record</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        end</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        DP-&gt;&gt;MAP: entities.set(tableName, recordMap)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    end</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP--&gt;&gt;CLI: SdeDataProvider instance</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Note over CLI,MAP: Querying</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    CLI-&gt;&gt;DP: getType(34)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP-&gt;&gt;MAP: entities.get(&quot;eve_types&quot;).get(34)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    MAP--&gt;&gt;DP: Tritanium record</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP--&gt;&gt;CLI: EveType</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    CLI-&gt;&gt;DP: getTypesByGroup(18)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP-&gt;&gt;DP: lazy-build FK index for eve_types:groupId</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP-&gt;&gt;MAP: fkIndexes.get(&quot;eve_types:groupId&quot;).get(18)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    MAP--&gt;&gt;DP: [Tritanium, Pyerite, ...]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DP--&gt;&gt;CLI: EveType[]</span></span></code></pre></div><h2 id="5-entity-relationship-diagram" tabindex="-1">5. Entity Relationship Diagram <a class="header-anchor" href="#5-entity-relationship-diagram" aria-label="Permalink to &quot;5. Entity Relationship Diagram&quot;">​</a></h2><div class="language-mermaid vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">mermaid</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">erDiagram</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    EveCategory ||--o{ EveGroup : &quot;has groups&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    EveGroup ||--o{ EveType : &quot;has types&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    EveType ||--o| TypeDogma : &quot;has dogma&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    EveType ||--o| TypeMaterial : &quot;has materials&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    EveType ||--o| TypeBonus : &quot;has bonuses&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Region ||--o{ Constellation : &quot;contains&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Constellation ||--o{ SolarSystem : &quot;contains&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o| Star : &quot;has star&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o{ Planet : &quot;has planets&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o{ Moon : &quot;has moons&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o{ AsteroidBelt : &quot;has belts&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o{ Stargate : &quot;has gates&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o{ NpcStation : &quot;has stations&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    SolarSystem ||--o{ SecondarySun : &quot;has secondary suns&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Stargate }|--|| SolarSystem : &quot;destination&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Faction ||--o{ NpcCorporation : &quot;has corps&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Faction ||--o{ Race : &quot;memberRaces&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Race ||--o{ Bloodline : &quot;has bloodlines&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Bloodline ||--o{ Ancestry : &quot;has ancestries&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    NpcCorporation ||--o{ NpcStation : &quot;owns&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    NpcCorporation ||--o{ NpcCharacter : &quot;employs&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    MarketGroup ||--o{ MarketGroup : &quot;parentGroupId (tree)&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    MarketGroup ||--o{ EveType : &quot;has types&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Blueprint ||--|| EveType : &quot;blueprintTypeId&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Blueprint ||--|| BlueprintActivities : &quot;activities&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DogmaAttribute }o--|| DogmaAttributeCategory : &quot;categoryId&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    DogmaAttribute }o--o| DogmaUnit : &quot;unitId&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    Skin ||--o{ SkinLicense : &quot;has licenses&quot;</span></span></code></pre></div><h2 id="6-key-design-decisions" tabindex="-1">6. Key Design Decisions <a class="header-anchor" href="#6-key-design-decisions" aria-label="Permalink to &quot;6. Key Design Decisions&quot;">​</a></h2><h3 id="yaml-native-no-sqlite" tabindex="-1">YAML-Native, No SQLite <a class="header-anchor" href="#yaml-native-no-sqlite" aria-label="Permalink to &quot;YAML-Native, No SQLite&quot;">​</a></h3><p>The original design used better-sqlite3 to import SDE YAML into an SQLite database. This was replaced with direct YAML-to-Map loading because:</p><ul><li><strong>Simpler dependency tree</strong>: No native binary dependency (better-sqlite3 requires node-gyp)</li><li><strong>No build/import step</strong>: No separate database build required before querying</li><li><strong>Native JS types</strong>: Objects, arrays, booleans stay as-is instead of being serialized to JSON text columns</li><li><strong>Measured performance</strong>: load time and memory are benchmarked (<code>tests/benchmark/sde.bench.ts</code>, <code>npm run soak -- --sde</code>) and published nightly against CCP&#39;s current export by <code>nightly-sde.yml</code>; the figures in the step summary are the ones to quote</li><li><strong>Nested structures preserved</strong>: Stargate <code>destination</code>, star <code>statistics</code>, blueprint <code>activities</code> remain native objects</li></ul><h3 id="zlooseobject-for-all-schemas" tabindex="-1"><code>z.looseObject()</code> for All Schemas <a class="header-anchor" href="#zlooseobject-for-all-schemas" aria-label="Permalink to &quot;\`z.looseObject()\` for All Schemas&quot;">​</a></h3><p>CCP may add new fields to SDE YAML at any time. Using <code>z.looseObject({})</code> instead of <code>z.object({})</code> means:</p><ul><li>Extra/unknown fields pass validation and are preserved on the output</li><li>Consumers can access new CCP fields immediately without waiting for a schema update</li><li>Matches the main ESI SDK&#39;s established pattern</li></ul><h3 id="lazy-fk-index-building" tabindex="-1">Lazy FK Index Building <a class="header-anchor" href="#lazy-fk-index-building" aria-label="Permalink to &quot;Lazy FK Index Building&quot;">​</a></h3><p>Foreign key indexes are built on first query, not at load time:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>getByFk(&quot;eve_types&quot;, &quot;groupId&quot;, 18)</span></span>
<span class="line"><span>  -&gt; checks fkIndexes for &quot;eve_types:groupId&quot;</span></span>
<span class="line"><span>  -&gt; if missing: scans all eve_types, builds Map&lt;groupId, Type[]&gt;, caches it</span></span>
<span class="line"><span>  -&gt; returns cached result</span></span></code></pre></div><p>This avoids building indexes for FK relationships that are never queried. Many of the 102 entity tables have FK columns that most consumers never filter by.</p><h3 id="transformrecordnative-vs-transformrecord" tabindex="-1"><code>transformRecordNative</code> vs <code>transformRecord</code> <a class="header-anchor" href="#transformrecordnative-vs-transformrecord" aria-label="Permalink to &quot;\`transformRecordNative\` vs \`transformRecord\`&quot;">​</a></h3><p>Two transform functions exist:</p><table tabindex="0"><thead><tr><th>Function</th><th>Output types</th><th>Use case</th></tr></thead><tbody><tr><td><code>transformRecord</code></td><td><code>Record&lt;string, SqliteValue&gt;</code></td><td>Legacy SQLite path (booleans to 0/1, objects to JSON strings)</td></tr><tr><td><code>transformRecordNative</code></td><td><code>Record&lt;string, unknown&gt;</code></td><td>YAML-native path (preserves JS types as-is)</td></tr></tbody></table><p><code>transformRecordNative</code> is used by <code>SdeDataProvider</code>. Both share field normalization (<code>groupID</code> to <code>groupId</code>) and locale extraction (<code>{en: &quot;Jita&quot;}</code> to <code>&quot;Jita&quot;</code>).</p><h3 id="recursive-nested-normalization" tabindex="-1">Recursive Nested Normalization <a class="header-anchor" href="#recursive-nested-normalization" aria-label="Permalink to &quot;Recursive Nested Normalization&quot;">​</a></h3><p>CCP&#39;s YAML uses <code>PascalCaseID</code> field names at all levels. The <code>normalizeNested()</code> function recursively normalizes keys in nested objects and arrays:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Raw YAML:    { destination: { solarSystemID: 30000140, stargateID: 50000802 } }</span></span>
<span class="line"><span>Normalized:  { destination: { solarSystemId: 30000140, stargateId: 50000802 } }</span></span></code></pre></div><p>This ensures that typed interfaces (e.g., <code>StargateDestination.solarSystemId</code>) match the runtime data regardless of nesting depth.</p><h3 id="sde_file_registry-as-single-source-of-truth" tabindex="-1">SDE_FILE_REGISTRY as Single Source of Truth <a class="header-anchor" href="#sde_file_registry-as-single-source-of-truth" aria-label="Permalink to &quot;SDE_FILE_REGISTRY as Single Source of Truth&quot;">​</a></h3><p>All 102 YAML files are registered in one array:</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">interface</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> SdeFileSpec</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  yamlFile</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> string</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">; </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// &quot;mapRegions.yaml&quot;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  tableName</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> string</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">; </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// &quot;eve_regions&quot;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  idAttribute</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> string</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">; </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// &quot;regionId&quot;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  idType</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;number&#39;</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> |</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;string&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  injectId</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> boolean</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">; </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// true = YAML key becomes the PK field</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p><code>SdeDataProvider.fromDirectory()</code> iterates this registry and skips missing files silently. This means the provider works with partial SDE extracts and is forward-compatible with new CCP YAML files (add a registry entry and interface).</p><h3 id="portadapter-pattern" tabindex="-1">Port/Adapter Pattern <a class="header-anchor" href="#portadapter-pattern" aria-label="Permalink to &quot;Port/Adapter Pattern&quot;">​</a></h3><p><code>IStaticDataProvider</code> is the port (97 typed methods). Implementations are adapters:</p><ul><li><strong>SdeDataProvider</strong> — production adapter, reads YAML from disk or ZIP</li><li><strong>MemorySdeProvider</strong> — test adapter, accepts typed arrays, no I/O</li></ul><h3 id="error-taxonomy" tabindex="-1">Error Taxonomy <a class="header-anchor" href="#error-taxonomy" aria-label="Permalink to &quot;Error Taxonomy&quot;">​</a></h3><p>SDE errors extend <code>Error</code> directly, not <code>EsiError</code>. They are local data access errors with no HTTP semantics:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Error</span></span>
<span class="line"><span>  +-- SdeError (base)</span></span>
<span class="line"><span>        +-- SdeDatabaseError (open/query failures)</span></span>
<span class="line"><span>        +-- SdeValidationError (Zod validation failures)</span></span>
<span class="line"><span>        +-- SdeVersionMismatchError (schema incompatibility)</span></span></code></pre></div><p>Each error class has a corresponding type guard function (<code>isSdeError</code>, <code>isSdeDatabaseError</code>, etc.).</p><h2 id="7-testing-architecture" tabindex="-1">7. Testing Architecture <a class="header-anchor" href="#7-testing-architecture" aria-label="Permalink to &quot;7. Testing Architecture&quot;">​</a></h2><div class="language-mermaid vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">mermaid</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">graph TB</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    subgraph &quot;Testing Pyramid&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        direction TB</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        integration[&quot;Integration Tests (114 tests, nightly)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Real CCP SDE data via nightly-sde.yml</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Well-known entity lookups</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Referential integrity checks</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Row count validation</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Export drift against the registry and schemas&quot;]</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        bdd[&quot;BDD Scenarios (192 scenarios, 23 features)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        137 EARS Rules, one per requirement</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Every provider method reached by a Rule</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Universe, market, dogma, character, NPC families</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Loading, optional peers, memory entry, ingestion&quot;]</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        unit[&quot;Unit Tests (580 tests, 17 suites)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Schema validation (valid/invalid/extra fields)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        SdeTestDataFactory (defaults + overrides)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        MemorySdeProvider and SdeDataProvider (all query methods)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        IStaticDataProvider contract (null/empty returns)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        Ingestion: download, extract, build, transforms&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    end</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    integration --- bdd</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    bdd --- unit</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    style unit fill:#4caf50,color:#fff</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    style bdd fill:#2196f3,color:#fff</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    style integration fill:#ff9800,color:#fff</span></span></code></pre></div><p>Beneath the pyramid sit the tiers that say whether the tests above it can fail: three fuzz suites (249 property and schema tests), two tsd files, unit, BDD-only and type mutation with per-directory floors, the layer and determinism lints, the benchmarks and the heap soak. <a href="./sde-testing">TESTING.md</a> is the scorecard: every tier, its measured number, its floor and the command that reproduces it.</p><h3 id="test-infrastructure" tabindex="-1">Test Infrastructure <a class="header-anchor" href="#test-infrastructure" aria-label="Permalink to &quot;Test Infrastructure&quot;">​</a></h3><table tabindex="0"><thead><tr><th>Component</th><th>Purpose</th></tr></thead><tbody><tr><td><code>SdeTestDataFactory</code></td><td>Creates realistic test fixtures matching real CCP data structures. One factory method per entity type. <code>createHierarchicalTestData()</code> builds a connected graph of entities.</td></tr><tr><td><code>MemorySdeProvider</code></td><td>Accepts typed arrays via <code>MemorySdeData</code>, implements <code>IStaticDataProvider</code>. Used in all unit and BDD tests. No file I/O.</td></tr><tr><td><code>IStaticDataProvider</code> contract tests</td><td>Verify null returns for missing IDs, empty arrays for missing FK values, and correct typing on all 96 methods.</td></tr><tr><td>Integration tests</td><td>Load real CCP SDE data via <code>SdeDataProvider.fromDirectory()</code>. Skipped automatically when <code>sde-data/</code> directory is absent; <code>nightly-sde.yml</code> downloads the current export and requires them to run.</td></tr></tbody></table><h3 id="running-tests" tabindex="-1">Running Tests <a class="header-anchor" href="#running-tests" aria-label="Permalink to &quot;Running Tests&quot;">​</a></h3><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> jest</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --config</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> config/jest/unit.config.cjs</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> tests/tdd/sde</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                    # Unit (580 tests, ~23s)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> run</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> bdd:sde</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                                                                # BDD (192 scenarios, ~12s)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> jest</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --config</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> config/jest/fuzz.config.cjs</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> sde</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">                              # Fuzz (249 tests, ~18s)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> jest</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --config</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> config/jest/integration.config.cjs</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> tests/integration/sde/</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    # Integration (114 tests; needs sde-data/)</span></span></code></pre></div><h2 id="8-module-file-layout" tabindex="-1">8. Module File Layout <a class="header-anchor" href="#8-module-file-layout" aria-label="Permalink to &quot;8. Module File Layout&quot;">​</a></h2><p>Since Track S Run 12 the module is laid out by role, and <code>npm run lint:layers</code> keeps each folder importing only the folders beneath it (the table is in <a href="./sde#layers-inside-the-module">SDE.md</a>).</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>src/sde/</span></span>
<span class="line"><span>  index.ts                  # ./sde entry point</span></span>
<span class="line"><span>  memory.ts                 # ./sde/memory entry point (no file code)</span></span>
<span class="line"><span>  version.ts                # SdeVersionInfo type</span></span>
<span class="line"><span>  errors.ts                 # SdeError hierarchy (4 error classes + type guards)</span></span>
<span class="line"><span>  clock.ts                  # The module&#39;s clock (a Clock port)</span></span>
<span class="line"><span>  optionalPeers.ts          # Lazy js-yaml / adm-zip loading</span></span>
<span class="line"><span>  ports/</span></span>
<span class="line"><span>    IStaticDataProvider.ts  # 99-method interface contract</span></span>
<span class="line"><span>  domain/</span></span>
<span class="line"><span>    types.ts                # Barrel: every entity interface</span></span>
<span class="line"><span>    schemas.ts              # Barrel: every Zod schema</span></span>
<span class="line"><span>    &lt;domain&gt;/types.ts       # Entity interfaces of one SDE domain (universe, types,</span></span>
<span class="line"><span>    &lt;domain&gt;/schemas.ts     # dogma, industry, market, characters, corporations,</span></span>
<span class="line"><span>                            # skins, content, ui) and the schemas that validate them</span></span>
<span class="line"><span>    version/schemas.ts      # SdeVersionSchema</span></span>
<span class="line"><span>  providers/</span></span>
<span class="line"><span>    order.ts                # ID ordering shared by both providers</span></span>
<span class="line"><span>    yaml/SdeDataProvider.ts # YAML-backed provider (fromDirectory, fromZip)</span></span>
<span class="line"><span>    memory/MemorySdeProvider.ts  # In-memory provider</span></span>
<span class="line"><span>  ingestion/</span></span>
<span class="line"><span>    constants.ts            # SDE_FILE_REGISTRY (102 entries), CCP URLs</span></span>
<span class="line"><span>    SdeDownloader.ts        # HTTP download with progress callback</span></span>
<span class="line"><span>    SdeExtractor.ts         # ZIP extraction and YAML parsing</span></span>
<span class="line"><span>    metadata.ts             # _sde.yaml parsing</span></span>
<span class="line"><span>    transforms.ts           # Field normalization, locale extraction</span></span>
<span class="line"><span>    index.ts                # Barrel exports</span></span>
<span class="line"><span>  testing/</span></span>
<span class="line"><span>    SdeTestDataFactory.ts   # Test fixture factory</span></span></code></pre></div><p>The guides (this file, <a href="./sde-api_contracts">API_CONTRACTS.md</a>, <a href="./sde-developer_guide">DEVELOPER_GUIDE.md</a>, <a href="./sde-usage">USAGE.md</a>) live in <code>guides/sde/</code>, with <a href="./sde">guides/SDE.md</a> as the front door.</p>`,53)])])}const k=a(t,[["render",l]]);export{E as __pageData,k as default};
