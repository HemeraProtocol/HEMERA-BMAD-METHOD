# PRD Amendment 01: Data Integration Layer

## Amendment Metadata
- **Date:** 2025-01-26
- **Version:** 1.0
- **Author:** John (PM)
- **PRD Version Affected:** v4
- **Status:** Draft

## Executive Summary

This amendment adds specifications for the Data Integration Layer to enable the Crypto Investment Committee to access market data. The approach uses a mock-first strategy with swappable interfaces, allowing immediate system functionality while maintaining clear integration points for future real data sources.

## Problem Statement

The current PRD lacks specification for how the system obtains market data required for the three daily questions:
- No data source definitions
- No integration architecture
- No fallback strategies
- Agents cannot function without data context

This gap prevents the system from providing actionable investment analysis.

## Proposed Solution

Implement a **Data Service Layer** with:
1. Abstract interfaces for all data types
2. Mock implementations for MVP
3. Clear integration points for real APIs
4. Context enrichment independent of data source

## Requirements Additions

### Functional Requirements (New)

- **FR11:** System shall provide abstract data service interfaces for market, on-chain, macro, and sentiment data
- **FR12:** System shall operate fully with mock data implementations matching real data patterns
- **FR13:** Data services shall be swappable without modifying agent or task logic
- **FR14:** System shall aggregate data from multiple services into enriched context for agents
- **FR15:** System shall handle partial data availability gracefully with fallback strategies

### Non-Functional Requirements (New)

- **NFR9:** System shall operate fully with mock data for MVP demonstration
- **NFR10:** Data service interfaces shall support hot-swapping without code changes
- **NFR11:** Real data integration shall not require agent or task modifications
- **NFR12:** Mock data shall include realistic market scenarios (bull/bear/crisis)
- **NFR13:** Data service layer shall maintain <100ms response time for mock data

## Architecture Updates

### New Component: Data Service Layer

```
┌─────────────────────────────────────────────┐
│           Agent Committee Layer              │
├─────────────────────────────────────────────┤
│           Task Execution Layer               │
├─────────────────────────────────────────────┤
│         Context Enrichment Layer             │ ← NEW
├─────────────────────────────────────────────┤
│         Data Service Interfaces              │ ← NEW
├─────────────────┬───────────────────────────┤
│   Mock Services  │  Real Services (Future)   │ ← NEW
└─────────────────┴───────────────────────────┘
```

### Data Service Interfaces

```python
# Core abstraction for all data services
class DataService(ABC):
    @abstractmethod
    async def health_check(self) -> bool:
        """Verify service availability"""
        pass
    
    @abstractmethod
    async def get_last_update(self) -> datetime:
        """Get timestamp of last data update"""
        pass

# Market data for prices and volume
class MarketDataService(DataService):
    @abstractmethod
    async def get_price(self, symbol: str) -> PriceData:
        pass
    
    @abstractmethod
    async def get_24h_change(self, symbol: str) -> float:
        pass
    
    @abstractmethod
    async def get_volume(self, symbol: str) -> VolumeData:
        pass
    
    @abstractmethod
    async def detect_breakout(self, symbol: str) -> BreakoutSignal:
        pass

# On-chain metrics
class OnChainDataService(DataService):
    @abstractmethod
    async def get_network_metrics(self, chain: str) -> NetworkMetrics:
        pass
    
    @abstractmethod
    async def get_whale_movements(self, threshold: float) -> List[WhaleTransaction]:
        pass
    
    @abstractmethod
    async def get_exchange_flows(self) -> ExchangeFlows:
        pass

# Macro economic indicators
class MacroDataService(DataService):
    @abstractmethod
    async def get_dxy(self) -> float:
        pass
    
    @abstractmethod
    async def get_treasury_yield(self, duration: str) -> float:
        pass
    
    @abstractmethod
    async def get_fed_calendar(self) -> List[FedEvent]:
        pass
    
    @abstractmethod
    async def get_economic_indicators(self) -> EconomicIndicators:
        pass

# Social sentiment and news
class SentimentDataService(DataService):
    @abstractmethod
    async def get_fear_greed_index(self) -> int:
        pass
    
    @abstractmethod
    async def get_social_volume(self, symbol: str) -> SocialMetrics:
        pass
    
    @abstractmethod
    async def get_news_events(self, hours: int) -> List[NewsEvent]:
        pass
```

### Context Enrichment

```python
class ContextBuilder:
    """Aggregates data from all services into agent context"""
    
    def __init__(self, services: Dict[str, DataService]):
        self.services = services
        self.cache = TTLCache(maxsize=100, ttl=60)
    
    async def build_context(self, query_type: str) -> MarketContext:
        """Build enriched context for agent analysis"""
        context = MarketContext()
        
        # Gather from all services
        context.prices = await self._get_prices()
        context.indicators = await self._get_indicators()
        context.events = await self._detect_events()
        
        # Calculate derived metrics
        context.volatility = self._calculate_volatility(context.prices)
        context.regime = self._detect_regime(context.indicators)
        
        # Detect significant conditions
        if abs(context.prices['BTC'].change_24h) > 5:
            context.add_alert('significant_move', context.prices['BTC'])
        
        return context
```

## New Epic: Data Integration Layer

### Epic 6: Data Integration Layer

**Goal:** Implement swappable data service interfaces with mock data for MVP and real data integration pathway

### Story 6.1: Design Data Service Interfaces
**As a** developer  
**I want** clean data service interfaces  
**So that** mock and real implementations are interchangeable

**Acceptance Criteria:**
1. Abstract DataService base class with standard methods
2. MarketDataService interface for price/volume data  
3. OnChainDataService interface for blockchain metrics
4. MacroDataService interface for economic indicators
5. SentimentDataService interface for social/news data
6. All interfaces return standardized data structures
7. Error handling and fallback strategies defined
8. Type hints and documentation for all methods

### Story 6.2: Implement Mock Data Services
**As a** developer  
**I want** mock data implementations  
**So that** the system can operate without external dependencies

**Acceptance Criteria:**
1. MockMarketDataService with realistic price scenarios
2. Mock scenarios for different market conditions:
   - Bull market (+5-15% daily moves)
   - Bear market (-5-15% daily moves)  
   - Crab market (±2% choppy action)
   - Crisis events (±20% volatility)
3. Configurable scenario selection via environment variable
4. Mock data follows same interface contracts
5. Historical patterns for realistic responses
6. Event triggers (rate decisions, hacks, regulatory news)
7. Deterministic mode for testing

### Story 6.3: Create Data Context Builder
**As** agents  
**We need** enriched context from multiple sources  
**So that** our analysis is comprehensive

**Acceptance Criteria:**
1. Aggregates data from all service interfaces
2. Calculates derived metrics:
   - Percentage changes
   - Volatility measures
   - Trend indicators
3. Detects significant events:
   - Price moves >5%
   - Volume spikes >2x average
   - Technical breakouts
4. Packages context for agent consumption
5. TTL caching with 60-second expiry
6. Handles partial data gracefully
7. Logs data availability status

### Story 6.4: Create Real Data Integration Guide
**As a** future developer  
**I need** clear integration documentation  
**So that** I can connect real APIs easily

**Acceptance Criteria:**
1. Integration guide document with:
   - Service interface contracts
   - Example implementations
   - Authentication patterns
   - Rate limiting strategies
2. Stub implementations with TODO markers:
   - BinanceMarketDataService
   - GlassnodeOnChainService
   - FedMacroDataService
3. Configuration management for API keys
4. Error handling examples
5. Testing strategies for real integrations
6. Migration checklist from mock to real

### Story 6.5: Implement Data Service Registry
**As a** system  
**I need** dynamic service registration  
**So that** services can be swapped at runtime

**Acceptance Criteria:**
1. ServiceRegistry class for managing services
2. Configuration-based service selection
3. Health check monitoring
4. Automatic fallback to mock if real service fails
5. Service metrics and logging
6. Hot-reload capability without restart
7. Service dependency injection

## Testing Strategy Updates

### New Test Categories

1. **Mock Scenario Tests**
   - Bull market agent responses
   - Bear market recommendations
   - Crisis event handling
   - Data unavailability scenarios

2. **Interface Compliance Tests**
   - Mock services implement all methods
   - Return types match specifications
   - Error handling consistency
   - Performance benchmarks

3. **Integration Pathway Tests**
   - Service swapping works correctly
   - Fallback mechanisms trigger properly
   - Partial data handling
   - Cache behavior validation

## Implementation Timeline

### Phase 1: Foundation (Current Sprint)
- Design service interfaces
- Implement basic mock services
- Update Story 1.2 to include service layer

### Phase 2: Mock Implementation (Next Sprint)
- Complete mock data scenarios
- Build context enrichment
- Test with agent committee

### Phase 3: Integration Prep (Future Sprint)
- Create integration guide
- Build service registry
- Implement one real service as reference

### Phase 4: Real Data (Handoff Ready)
- Document for colleague takeover
- Provide example implementations
- Support gradual migration

## Migration Strategy

1. **Start with Mock**: All services use mock implementations
2. **Hybrid Mode**: Mix mock and real services based on availability
3. **Full Integration**: Gradually replace all mocks with real services
4. **Maintain Mock Mode**: Keep mock option for testing/demo

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Caching layer, request batching |
| Service downtime | High | Fallback to mock data |
| Data inconsistency | Medium | Validation layer, reconciliation |
| Cost overruns | Medium | Usage monitoring, alerts |
| Integration complexity | Medium | Clean interfaces, documentation |

## Success Criteria

1. System operates fully with mock data (MVP milestone)
2. Service interfaces remain stable through implementation
3. Real service integration requires <1 day per service
4. No agent or task modifications needed for real data
5. Performance maintained (<100ms response time)

## Documentation Requirements

1. Service interface specifications
2. Mock data scenario descriptions
3. Integration guide for each service type
4. Configuration management guide
5. Troubleshooting playbook
6. Performance benchmarking guide

## Appendix A: Mock Data Examples

### Market Data Mock Response
```json
{
  "symbol": "BTCUSDT",
  "price": 45000.00,
  "change_24h": -5.2,
  "volume_24h": 28500000000,
  "high_24h": 47500.00,
  "low_24h": 44800.00,
  "timestamp": "2025-01-26T10:30:00Z",
  "scenario": "bear_market",
  "events": ["fed_rate_decision"]
}
```

### Macro Data Mock Response
```json
{
  "dxy": 105.5,
  "treasury_10y": 4.25,
  "cpi_latest": 3.2,
  "unemployment": 3.7,
  "fed_next_meeting": "2025-01-31",
  "market_regime": "tightening"
}
```

## Appendix B: Service Configuration

```yaml
# config/services.yaml
data_services:
  market:
    provider: mock  # or 'binance', 'coinbase'
    config:
      scenario: bear_market
      volatility: high
  
  onchain:
    provider: mock  # or 'glassnode'
    config:
      whale_threshold: 1000
  
  macro:
    provider: mock  # or 'fred'
    config:
      include_forecasts: true
  
  sentiment:
    provider: mock  # or 'alternative'
    config:
      fear_greed_override: 25
```

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-26 | 1.0 | Initial amendment for data integration | John (PM) |

---

*This amendment should be integrated into the main PRD.md file once approved.*