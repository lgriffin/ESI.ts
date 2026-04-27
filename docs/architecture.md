# ESI.ts Architecture

## 1. Clean Architecture Layers

Dependency direction flows inward. Outer layers depend on inner layers, never the reverse.

```mermaid
graph TB
    subgraph External["External"]
        ESI["ESI API<br/>(esi.evetech.net)"]
        Consumer["Consumer Application"]
    end

    subgraph PublicAPI["Public API Layer"]
        EsiClient["EsiClient"]
        EsiClientBuilder["EsiClientBuilder"]
        EsiApiFactory["EsiApiFactory"]
        Index["index.ts exports"]
    end

    subgraph DomainClients["Domain Client Layer (33 clients)"]
        Alliance["AllianceClient"]
        Character["CharacterClient"]
        Market["MarketClient"]
        Universe["UniverseClient"]
        More["... 29 more"]
    end

    subgraph EndpointLayer["Endpoint Definition Layer"]
        EndpointDef["EndpointDefinition"]
        EndpointFiles["*Endpoints.ts (33 files)"]
        CreateClient["createClient()"]
        Registry["ClientRegistry"]
    end

    subgraph CoreLayer["Core Request Orchestration"]
        Handler["ApiRequestHandler"]
        Middleware["MiddlewareManager"]
        RateLimiter["RateLimiter"]
        CircuitBreaker["CircuitBreaker"]
        Cache["ETagCacheManager"]
        Pagination["PaginationHandler"]
        CursorPagination["CursorPaginationHandler"]
        TokenRefresh["Token Refresh"]
    end

    subgraph Interfaces["Interface Contracts"]
        ICache["ICache"]
        IRateLimiter["IRateLimiter"]
        ILogger["ILogger"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        ApiClient["ApiClient"]
        HeadersUtil["parseHeaders()"]
        Validation["validation"]
        ErrorUtil["EsiError"]
        Logger["Winston Logger"]
        Constants["constants"]
    end

    Consumer --> Index
    Index --> EsiClient
    Index --> EsiClientBuilder
    Index --> EsiApiFactory

    EsiClient --> Alliance
    EsiClient --> Character
    EsiClient --> Market
    EsiClient --> Universe
    EsiClient --> More

    Alliance --> CreateClient
    Character --> CreateClient
    Market --> CreateClient
    Universe --> CreateClient

    CreateClient --> EndpointDef
    CreateClient --> EndpointFiles
    CreateClient --> Handler

    Registry --> Alliance
    Registry --> Character
    Registry --> Market
    Registry --> Universe

    Handler --> Middleware
    Handler --> RateLimiter
    Handler --> CircuitBreaker
    Handler --> Cache
    Handler --> Pagination
    Handler --> TokenRefresh

    Cache -.->|implements| ICache
    RateLimiter -.->|implements| IRateLimiter
    Logger -.->|implements| ILogger

    Handler --> ApiClient
    Handler --> HeadersUtil
    Handler --> Validation
    Handler --> ErrorUtil
    Handler --> Constants

    ApiClient --> ESI

    style External fill:#f5f5f5,stroke:#999
    style PublicAPI fill:#e3f2fd,stroke:#1565c0
    style DomainClients fill:#e8f5e9,stroke:#2e7d32
    style EndpointLayer fill:#fff3e0,stroke:#e65100
    style CoreLayer fill:#fce4ec,stroke:#c62828
    style Interfaces fill:#f3e5f5,stroke:#6a1b9a
    style Infrastructure fill:#eceff1,stroke:#37474f
```

## 2. Request Lifecycle

Complete flow from consumer call to ESI response.

```mermaid
sequenceDiagram
    participant App as Consumer
    participant Client as EsiClient
    participant Domain as DomainClient
    participant Create as createClient()
    participant Handler as handleRequest()
    participant MW as MiddlewareManager
    participant CB as CircuitBreaker
    participant RL as RateLimiter
    participant Cache as ETagCache
    participant Fetch as fetch()
    participant ESI as ESI API

    App->>Client: client.market.getMarketPrices()
    Client->>Domain: MarketClient.getMarketPrices()
    Domain->>Create: validate params, build path
    Create->>Handler: handleRequest(client, endpoint, method)

    Note over Handler: executeRequest begins

    Handler->>Handler: buildRequestHeaders()
    Handler->>Cache: getETag(url)
    Cache-->>Handler: If-None-Match header

    Handler->>MW: applyRequestInterceptors(context)
    MW-->>Handler: modified headers/url/body

    Handler->>CB: checkCircuit(endpoint)
    alt Circuit Open
        CB-->>Handler: throw CircuitOpenError
    end

    Handler->>RL: checkRateLimit()
    alt Rate Limited
        RL-->>RL: sleep(waitTime)
    end

    Handler->>Fetch: fetch(url, options)
    Fetch->>ESI: HTTP request
    ESI-->>Fetch: HTTP response

    Handler->>Handler: parseHeaders(response)
    Handler->>RL: updateFromResponse(headers, status)

    Handler->>CB: recordSuccess/Failure(endpoint)

    alt Status 304
        Handler->>Cache: get(url)
        Cache-->>Handler: cached data + headers
    else Status 2xx
        Handler->>Handler: parseJsonBody()
        Handler->>Cache: set(url, etag, data)
        alt Multi-page (x-pages > 1)
            Handler->>Handler: handleOffsetPagination()
        else Cursor pagination
            Handler->>Handler: handleCursorPagination()
        end
    else Status 401 + TokenProvider
        Handler->>Handler: refreshToken()
        Handler->>Handler: retry executeRequest
    else Status 5xx + Cache
        Handler->>Cache: get(url) stale
        Cache-->>Handler: stale cached data
    else Status 4xx/5xx
        Handler-->>App: throw EsiError
    end

    Handler->>MW: applyResponseInterceptors(context)
    MW-->>Handler: modified body/headers

    Handler-->>App: { headers, body, fromCache?, cursors? }
```

## 3. Dependency Injection

How dependencies are resolved: client-level first, then global fallback.

```mermaid
graph LR
    subgraph ApiClient["ApiClient (per-instance)"]
        ClientCache["cache: ICache | null"]
        ClientRL["rateLimiter: IRateLimiter | null"]
        ClientCB["circuitBreaker: CircuitBreaker | null"]
        ClientMW["middleware: MiddlewareManager"]
    end

    subgraph Globals["Global Singletons (fallback)"]
        GlobalCache["globalCache: ETagCacheManager"]
        GlobalCB["globalCircuitBreaker: CircuitBreaker"]
        GlobalRL["RateLimiter.getInstance()"]
    end

    subgraph Resolution["Dependency Resolution"]
        ResolveCache["resolveCache(client)"]
        ResolveRL["resolveRateLimiter(client)"]
        ResolveCB["resolveCircuitBreaker(client)"]
    end

    subgraph Interfaces["Interface Contracts"]
        ICache["ICache"]
        IRateLimiter["IRateLimiter"]
        ILogger["ILogger"]
    end

    ResolveCache -->|"client.getCache() ??"| ClientCache
    ResolveCache -->|fallback| GlobalCache
    ResolveRL -->|"client.getRateLimiter() ??"| ClientRL
    ResolveRL -->|fallback| GlobalRL
    ResolveCB -->|"client.getCircuitBreaker() ??"| ClientCB
    ResolveCB -->|fallback| GlobalCB

    ClientCache -.->|typed as| ICache
    ClientRL -.->|typed as| IRateLimiter
    GlobalCache -.->|implements| ICache
    GlobalRL -.->|implements| IRateLimiter

    style Interfaces fill:#f3e5f5,stroke:#6a1b9a
    style Resolution fill:#e8f5e9,stroke:#2e7d32
    style ApiClient fill:#e3f2fd,stroke:#1565c0
    style Globals fill:#fff3e0,stroke:#e65100
```

## 4. Circuit Breaker State Machine

```mermaid
stateDiagram-v2
    [*] --> Closed

    Closed --> Closed: Success / 4xx error
    Closed --> Open: failures >= threshold (5xx)

    Open --> Open: timeout not elapsed
    Open --> HalfOpen: timeout elapsed

    HalfOpen --> Closed: probe succeeds
    HalfOpen --> Open: probe fails (5xx)

    note right of Closed
        All requests pass through.
        Consecutive 5xx failures
        increment counter.
        Any success resets counter.
    end note

    note right of Open
        All requests blocked with
        CircuitOpenError.
        Waits for resetTimeoutMs
        (default 30s).
    end note

    note left of HalfOpen
        Allows limited probe requests
        (halfOpenMaxAttempts, default 1).
        Success closes circuit.
        Failure re-opens it.
    end note
```

## 5. CI/CD Pipeline

```mermaid
graph TB
    subgraph Trigger["Triggers"]
        Push["Push to branch"]
        PR["Pull Request"]
        Tag["Git Tag (v*.*.*)"]
    end

    subgraph Validation["Validation Stage"]
        Lint["ESLint"]
        Format["Prettier"]
        Build["TypeScript Compile"]
        Knip["Knip (dead code)"]
        Audit["npm audit"]
    end

    subgraph Testing["Test Stage"]
        Unit["Unit Tests<br/>(jest.unit.config)"]
        BDD["BDD Scenarios<br/>(30 domain suites)"]
        Coverage["Coverage Check<br/>(50% branch, 65% line)"]
        Matrix["Node 18, 20, 22"]
    end

    subgraph Quality["Quality Gate"]
        Gate["All checks pass"]
    end

    subgraph Release["Release Stage (tags only)"]
        NPM["npm publish"]
        Docs["TypeDoc generation"]
        Pages["GitHub Pages deploy"]
        Assets["Release assets"]
    end

    Push --> Validation
    PR --> Validation
    Tag --> Validation

    Lint --> Testing
    Format --> Testing
    Build --> Testing
    Knip --> Testing
    Audit --> Testing

    Unit --> Coverage
    BDD --> Coverage
    Unit --> Matrix

    Coverage --> Gate

    Tag --> Release
    Gate --> Release

    style Trigger fill:#e3f2fd,stroke:#1565c0
    style Validation fill:#fff3e0,stroke:#e65100
    style Testing fill:#e8f5e9,stroke:#2e7d32
    style Quality fill:#fce4ec,stroke:#c62828
    style Release fill:#f3e5f5,stroke:#6a1b9a
```

## 6. Client Creation Patterns

Three ways consumers can create clients, from simple to selective.

```mermaid
graph TB
    subgraph Pattern1["Pattern 1: Full Client (default)"]
        P1Code["const client = new EsiClient()"]
        P1Result["All 33 domain clients<br/>available via getters"]
        P1Code --> P1Result
    end

    subgraph Pattern2["Pattern 2: Builder (selective)"]
        P2Code["new EsiClientBuilder()<br/>.addClients(['market', 'alliance'])<br/>.withAccessToken(token)<br/>.build()"]
        P2Result["Only requested clients<br/>instantiated"]
        P2Code --> P2Result
    end

    subgraph Pattern3["Pattern 3: Factory (single client)"]
        P3Code["EsiApiFactory<br/>.createMarketClient(config)"]
        P3Result["Single domain client<br/>with fresh ApiClient"]
        P3Code --> P3Result
    end

    subgraph Shared["Shared Infrastructure"]
        ApiClient["ApiClient"]
        Cache["ETagCache"]
        RL["RateLimiter"]
        CB["CircuitBreaker"]
        MW["Middleware"]
    end

    P1Result --> ApiClient
    P2Result --> ApiClient
    P3Result --> ApiClient

    ApiClient --> Cache
    ApiClient --> RL
    ApiClient --> CB
    ApiClient --> MW

    style Pattern1 fill:#e3f2fd,stroke:#1565c0
    style Pattern2 fill:#e8f5e9,stroke:#2e7d32
    style Pattern3 fill:#fff3e0,stroke:#e65100
    style Shared fill:#eceff1,stroke:#37474f
```

## 7. Middleware Pipeline

How request and response interceptors are applied.

```mermaid
graph LR
    subgraph Request["Request Phase"]
        R1["Build Headers<br/>(auth, ETag, UA)"]
        R2["Interceptor 1<br/>(e.g., add trace ID)"]
        R3["Interceptor 2<br/>(e.g., add custom auth)"]
        R4["Interceptor N"]
    end

    subgraph Execution["Execution"]
        CB["Circuit Breaker<br/>check"]
        RL["Rate Limiter<br/>check"]
        Fetch["fetch()"]
    end

    subgraph Response["Response Phase"]
        Parse["Parse headers<br/>& body"]
        Cache["Cache response"]
        Paginate["Handle pagination"]
        I1["Interceptor 1<br/>(e.g., log timing)"]
        I2["Interceptor 2<br/>(e.g., transform)"]
        IN["Interceptor N"]
    end

    R1 --> R2 --> R3 --> R4
    R4 --> CB --> RL --> Fetch
    Fetch --> Parse --> Cache --> Paginate
    Paginate --> I1 --> I2 --> IN

    style Request fill:#e3f2fd,stroke:#1565c0
    style Execution fill:#fce4ec,stroke:#c62828
    style Response fill:#e8f5e9,stroke:#2e7d32
```

## 8. Test Architecture

```mermaid
graph TB
    subgraph TestTypes["Test Types"]
        TDD["TDD Unit Tests<br/>(tests/tdd/)"]
        BDD["BDD Scenarios<br/>(tests/bdd-scenarios/)"]
    end

    subgraph TDDTests["TDD Test Suites"]
        Core["Core Infrastructure<br/>ETagCache, RateLimiter,<br/>CircuitBreaker, Middleware,<br/>DI, TokenRefresh, Validation"]
        Clients["Domain Clients<br/>33 client test files<br/>(GET, POST, PUT, DELETE)"]
        Integration["Integration Tests<br/>Pagination, ETag flow,<br/>Rate limit integration"]
    end

    subgraph BDDTests["BDD Scenario Suites"]
        DomainBDD["Domain Scenarios<br/>alliance, character, market,<br/>universe, wallet, ... (30)"]
        PerfBDD["Performance Scenarios<br/>Concurrency, memory,<br/>large datasets"]
        IntBDD["Integration Scenarios<br/>Cross-domain workflows"]
    end

    subgraph Coverage["Coverage Enforcement"]
        Branches["Branches: 50%"]
        Functions["Functions: 50%"]
        Lines["Lines: 65%"]
        Statements["Statements: 65%"]
    end

    subgraph Tools["Test Infrastructure"]
        Jest["Jest + ts-jest"]
        FetchMock["jest-fetch-mock"]
        Factory["TestDataFactory"]
    end

    TDD --> TDDTests
    BDD --> BDDTests
    TDDTests --> Coverage
    BDDTests --> Coverage

    Jest --> TDD
    Jest --> BDD
    FetchMock --> Core
    FetchMock --> Clients
    Factory --> BDDTests

    style TestTypes fill:#e3f2fd,stroke:#1565c0
    style TDDTests fill:#e8f5e9,stroke:#2e7d32
    style BDDTests fill:#fff3e0,stroke:#e65100
    style Coverage fill:#fce4ec,stroke:#c62828
    style Tools fill:#eceff1,stroke:#37474f
```

## 9. Rate Limiting Strategy

```mermaid
graph TB
    subgraph NewSystem["New System (X-Ratelimit-*)"]
        Bucket["Token Bucket<br/>per IP + route group"]
        Costs["Token Costs:<br/>2xx = 2, 3xx = 1<br/>4xx = 5, 5xx = 0"]
        Decel["Proactive Deceleration<br/>at 20% remaining"]
        Block429["429 → block until<br/>Retry-After"]
    end

    subgraph LegacySystem["Legacy System (x-esi-error-limit-*)"]
        ErrorBudget["100 errors/minute"]
        SlowDown["Slow down at<br/>10 remaining"]
        Block420["420 → block until<br/>Retry-After"]
    end

    subgraph Decision["Rate Limit Check"]
        Start["checkRateLimit()"]
        IsBlocked{"Blocked?<br/>(420/429)"}
        LegacyLow{"Legacy errors<br/>< 10?"}
        LegacyZero{"Legacy errors<br/>= 0?"}
        BucketLow{"Bucket < 20%<br/>remaining?"}
        BucketEmpty{"Bucket<br/>empty?"}
        MinDelay["Enforce 50ms<br/>minimum delay"]
    end

    Start --> IsBlocked
    IsBlocked -->|Yes| Block429
    IsBlocked -->|No| LegacyZero
    LegacyZero -->|Yes| Block420
    LegacyZero -->|No| LegacyLow
    LegacyLow -->|Yes| SlowDown
    LegacyLow -->|No| BucketEmpty
    BucketEmpty -->|Yes| Decel
    BucketEmpty -->|No| BucketLow
    BucketLow -->|Yes| Decel
    BucketLow -->|No| MinDelay

    style NewSystem fill:#e3f2fd,stroke:#1565c0
    style LegacySystem fill:#fff3e0,stroke:#e65100
    style Decision fill:#e8f5e9,stroke:#2e7d32
```
